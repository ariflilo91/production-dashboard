import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  episode?: Episode; department?: Department
}
export type Holiday = {
  id: string; project_id: string; date: string; name: string; type: 'ph'|'sl'
}

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

export async function getEpisodes(projectId: string): Promise<Episode[]> {
  const { data, error } = await supabase.from('episodes').select('*').eq('project_id', projectId).order('name')
  if (error) throw error
  return data ?? []
}
export async function createEpisode(projectId: string, name: string, airDate?: string): Promise<Episode> {
  const { data, error } = await supabase.from('episodes').insert({
    project_id: projectId, name, air_date: airDate || null, priority: 'normal',
  }).select().single()
  if (error) throw error
  return data
}
export async function deleteEpisode(id: string): Promise<void> {
  const { error } = await supabase.from('episodes').delete().eq('id', id)
  if (error) throw error
}

export async function getDepartments(projectId: string): Promise<Department[]> {
  const { data, error } = await supabase.from('departments').select('*').eq('project_id', projectId).order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function getTasks(projectId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, episode:episodes(*), department:departments(*)')
    .eq('project_id', projectId)
  if (error) throw error
  return data ?? []
}
export async function upsertTask(task: Partial<Task> & { project_id: string }): Promise<Task> {
  const payload: Record<string, unknown> = {
    project_id: task.project_id, episode_id: task.episode_id,
    department_id: task.department_id, stage_code: task.stage_code,
    status: task.status, start_date: task.start_date, end_date: task.end_date,
    notes: task.notes,
  }
  if (task.id) payload.id = task.id
  const { data, error } = await supabase
    .from('tasks')
    .upsert(payload, { onConflict: 'id' })
    .select('*, episode:episodes(*), department:departments(*)')
    .single()
  if (error) throw error
  return data
}
export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

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

// ─── Notes ────────────────────────────────────────────

export type Note = {
  id: string
  title: string
  body: string
  author: string
  color: string
  pinned: boolean
  created_at: string
  updated_at: string
}

export async function getNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function upsertNote(note: Partial<Note>): Promise<Note> {
  const payload: Record<string, unknown> = {
    title:   note.title,
    body:    note.body ?? '',
    author:  note.author ?? 'Anonymous',
    color:   note.color ?? 'yellow',
    pinned:  note.pinned ?? false,
    updated_at: new Date().toISOString(),
  }
  if (note.id) payload.id = note.id
  const { data, error } = await supabase
    .from('notes')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}

export async function toggleNotePin(id: string, pinned: boolean): Promise<void> {
  const { error } = await supabase.from('notes').update({ pinned, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}
