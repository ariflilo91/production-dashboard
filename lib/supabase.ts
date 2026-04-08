import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Types ────────────────────────────────────────────

export type Project = {
  id: string; name: string; code: string; color: string
  status: string; notes?: string; created_at: string; updated_at: string
}
export type Episode = {
  id: string; project_id: string; name: string; air_date?: string; priority: string
}
export type Department = {
  id: string; project_id: string; name: string; full_name: string
  sort_order: number; group_name: string
}
export type Task = {
  id: string; project_id: string; episode_id: string; department_id: string
  stage_code: string; status: 'done'|'wip'|'review'|'overdue'|'risk'|'upcoming'
  start_date: string; end_date: string; notes?: string
  assigned_to?: string | null
  episode?: Episode; department?: Department; assignee?: TeamMember
}
export type Holiday = {
  id: string; project_id: string; date: string; name: string; type: 'ph'|'sl'
}
export type TeamMember = {
  id: string; user_id?: string; email: string; display_name?: string
  role: 'admin'|'member'; status: 'pending'|'approved'; avatar_url?: string
  notify_urgent: boolean; notify_weekly: boolean; created_at: string
}
export type DepartmentAssignment = {
  id: string; team_member_id: string; department_id: string; project_id: string
}

// ─── Auth ─────────────────────────────────────────────

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })
  if (error) throw error
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getCurrentMember(): Promise<TeamMember | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const { data } = await supabase.from('team_members').select('*').eq('user_id', user.id).single()
  return data ?? null
}

export function isAdmin(member: TeamMember | null): boolean {
  return member?.role === 'admin'
}

// ─── Projects ─────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('*').order('created_at')
  if (error) throw error
  return data ?? []
}
export async function getProject(id: string): Promise<Project> {
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).single()
  if (error) throw error
  return data
}
export async function createProject(project: Partial<Project>): Promise<Project> {
  const { data, error } = await supabase.from('projects').insert(project).select().single()
  if (error) throw error
  await supabase.rpc('seed_project_defaults', { p_project_id: data.id })
  return data
}

// ─── Episodes ─────────────────────────────────────────

export async function getEpisodes(projectId: string): Promise<Episode[]> {
  const { data, error } = await supabase.from('episodes').select('*').eq('project_id', projectId).order('name')
  if (error) throw error
  return data ?? []
}
export async function createEpisode(projectId: string, name: string, airDate?: string): Promise<Episode> {
  const { data, error } = await supabase.from('episodes').insert({ project_id: projectId, name, air_date: airDate || null, priority: 'normal' }).select().single()
  if (error) throw error
  return data
}
export async function deleteEpisode(id: string): Promise<void> {
  const { error } = await supabase.from('episodes').delete().eq('id', id)
  if (error) throw error
}

// ─── Departments ──────────────────────────────────────

export async function getDepartments(projectId: string): Promise<Department[]> {
  const { data, error } = await supabase.from('departments').select('*').eq('project_id', projectId).order('sort_order')
  if (error) throw error
  return data ?? []
}

// ─── Tasks ────────────────────────────────────────────

export async function getTasks(projectId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, episode:episodes(*), department:departments(*), assignee:team_members!assigned_to(*)')
    .eq('project_id', projectId)
  if (error) throw error
  return data ?? []
}

export async function getMyTasks(memberId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, episode:episodes(*), department:departments(*), project:projects(*)')
    .or(`assigned_to.eq.${memberId}`)
    .order('end_date')
  if (error) throw error
  return data ?? []
}

export async function upsertTask(task: Partial<Task> & { project_id: string }): Promise<Task> {
  const payload: Record<string, unknown> = {
    project_id: task.project_id, episode_id: task.episode_id,
    department_id: task.department_id, stage_code: task.stage_code,
    status: task.status, start_date: task.start_date, end_date: task.end_date,
    notes: task.notes, assigned_to: task.assigned_to ?? null,
  }
  if (task.id) payload.id = task.id
  const { data, error } = await supabase
    .from('tasks')
    .upsert(payload, { onConflict: 'id' })
    .select('*, episode:episodes(*), department:departments(*), assignee:team_members!assigned_to(*)')
    .single()
  if (error) throw error
  return data
}

export async function updateTaskStatus(id: string, status: Task['status']): Promise<void> {
  const { error } = await supabase.from('tasks').update({ status }).eq('id', id)
  if (error) throw error
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

// ─── Holidays ─────────────────────────────────────────

export async function getHolidays(projectId: string): Promise<Holiday[]> {
  const { data, error } = await supabase.from('holidays').select('*').eq('project_id', projectId).order('date')
  if (error) throw error
  return data ?? []
}
export async function upsertHoliday(h: Partial<Holiday> & { project_id: string }): Promise<Holiday> {
  const { data, error } = await supabase.from('holidays').upsert(h).select().single()
  if (error) throw error
  return data
}
export async function deleteHoliday(id: string): Promise<void> {
  const { error } = await supabase.from('holidays').delete().eq('id', id)
  if (error) throw error
}

// ─── Team Members ─────────────────────────────────────

export async function getTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase.from('team_members').select('*').order('created_at')
  if (error) throw error
  return data ?? []
}
export async function upsertTeamMember(member: Partial<TeamMember>): Promise<TeamMember> {
  const { data, error } = await supabase.from('team_members').upsert(member, { onConflict: 'email' }).select().single()
  if (error) throw error
  return data
}
export async function updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember> {
  const { data, error } = await supabase.from('team_members').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return data
}
export async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await supabase.from('team_members').delete().eq('id', id)
  if (error) throw error
}

// ─── Department Assignments ───────────────────────────

export async function getDeptAssignments(projectId?: string): Promise<DepartmentAssignment[]> {
  let q = supabase.from('department_assignments').select('*')
  if (projectId) q = q.eq('project_id', projectId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}
export async function assignDepartment(memberId: string, deptId: string, projectId: string): Promise<void> {
  const { error } = await supabase.from('department_assignments').upsert({ team_member_id: memberId, department_id: deptId, project_id: projectId }, { onConflict: 'team_member_id,department_id' })
  if (error) throw error
}
export async function unassignDepartment(memberId: string, deptId: string): Promise<void> {
  const { error } = await supabase.from('department_assignments').delete().eq('team_member_id', memberId).eq('department_id', deptId)
  if (error) throw error
}
