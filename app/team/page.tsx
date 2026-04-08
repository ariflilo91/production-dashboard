'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import TopNav from '@/components/TopNav'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import {
  getProjects, getTeamMembers, getDepartments, getDeptAssignments,
  upsertTeamMember, updateTeamMember, deleteTeamMember,
  assignDepartment, unassignDepartment,
  Project, TeamMember, Department, DepartmentAssignment
} from '@/lib/supabase'

const ROLES = [{ value: 'admin', label: 'Admin' }, { value: 'member', label: 'Member' }]

export default function TeamPage() {
  const { isAdmin, member: me } = useAuth()
  const router = useRouter()
  const [projects, setProjects]             = useState<Project[]>([])
  const [members, setMembers]               = useState<TeamMember[]>([])
  const [departments, setDepartments]       = useState<Record<string, Department[]>>({})
  const [assignments, setAssignments]       = useState<DepartmentAssignment[]>([])
  const [loading, setLoading]               = useState(true)
  const [newEmail, setNewEmail]             = useState('')
  const [newName, setNewName]               = useState('')
  const [newRole, setNewRole]               = useState<'admin'|'member'>('member')
  const [adding, setAdding]                 = useState(false)
  const [addError, setAddError]             = useState('')
  const [editId, setEditId]                 = useState<string|null>(null)
  const [editName, setEditName]             = useState('')
  const [editRole, setEditRole]             = useState<'admin'|'member'>('member')
  const [selectedProject, setSelectedProject] = useState('')

  useEffect(() => {
    if (!isAdmin) { router.replace('/'); return }
    load()
  }, [isAdmin])

  async function load() {
    const [projs, mems] = await Promise.all([getProjects(), getTeamMembers()])
    setProjects(projs); setMembers(mems)
    if (projs.length) {
      setSelectedProject(projs[0].id)
      const depts = await Promise.all(projs.map(p => getDepartments(p.id)))
      const deptMap: Record<string,Department[]> = {}
      projs.forEach((p,i) => { deptMap[p.id] = depts[i] })
      setDepartments(deptMap)
    }
    const asgns = await getDeptAssignments()
    setAssignments(asgns)
    setLoading(false)
  }

  async function handleAdd() {
    if (!newEmail.trim()) { setAddError('Email is required.'); return }
    if (!newEmail.endsWith('@durioo.com')) { setAddError('Must be a @durioo.com email.'); return }
    setAdding(true); setAddError('')
    try {
      const m = await upsertTeamMember({ email: newEmail.trim(), display_name: newName.trim() || newEmail.split('@')[0], role: newRole })
      setMembers(prev => { const idx = prev.findIndex(x => x.id === m.id); if (idx >= 0) { const n=[...prev]; n[idx]=m; return n } return [...prev, m] })
      setNewEmail(''); setNewName(''); setNewRole('member')
    } catch (e: unknown) { setAddError(e instanceof Error ? e.message : 'Error adding member') }
    setAdding(false)
  }

  async function handleSaveEdit(id: string) {
    const updated = await updateTeamMember(id, { display_name: editName, role: editRole })
    setMembers(prev => prev.map(m => m.id === id ? updated : m))
    setEditId(null)
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Remove ${email} from the team?`)) return
    await deleteTeamMember(id)
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  async function handleApprove(id: string) {
    const updated = await updateTeamMember(id, { status: 'approved' })
    setMembers(prev => prev.map(m => m.id === id ? updated : m))
  }

  async function toggleDeptAssign(memberId: string, deptId: string) {
    const existing = assignments.find(a => a.team_member_id === memberId && a.department_id === deptId)
    if (existing) {
      await unassignDepartment(memberId, deptId)
      setAssignments(prev => prev.filter(a => !(a.team_member_id === memberId && a.department_id === deptId)))
    } else {
      await assignDepartment(memberId, deptId, selectedProject)
      setAssignments(prev => [...prev, { id: '', team_member_id: memberId, department_id: deptId, project_id: selectedProject }])
    }
  }

  const inp: React.CSSProperties = { height: 34, padding: '0 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'inherit' }
  const sidebarProjects = projects.map(p => ({ id: p.id, name: p.name, color: p.color }))

  if (!isAdmin) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar projects={sidebarProjects} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopNav breadcrumbs={[{ label: 'Team management' }]} />
        <div style={{ padding: 20, maxWidth: 900, overflowY: 'auto' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Team management</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 24 }}>Invite team, assign departments, manage roles.</div>

          {/* Add member */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sub)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Invite team member</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Email *</div>
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="name@durioo.com" style={{ ...inp, width: 220 }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Display name</div>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Amir" style={{ ...inp, width: 150 }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Role</div>
                <select value={newRole} onChange={e => setNewRole(e.target.value as 'admin'|'member')} style={{ ...inp, width: 110 }}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <button onClick={handleAdd} disabled={adding} style={{ height: 34, padding: '0 16px', borderRadius: 7, background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid var(--blue-bdr)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {adding ? '...' : '+ Add'}
              </button>
            </div>
            {addError && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 8 }}>{addError}</div>}
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 10, lineHeight: 1.6 }}>
              Adding a member here allows them to log in with their @durioo.com Google account. They'll automatically get access when they sign in.
            </div>
          </div>

          {/* Team list */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sub)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-sub)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Team members</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {members.filter(m => (m as any).status === 'pending').length > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 10, background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid var(--amber-bdr)' }}>
                    {members.filter(m => (m as any).status === 'pending').length} pending
                  </span>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{members.length} total</div>
              </div>
            </div>
            {loading ? (
              <div style={{ padding: 20, color: 'var(--text-dim)', fontSize: 12 }}>Loading...</div>
            ) : (
              members.map(m => (
                <div key={m.id} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                  {editId === m.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', flexWrap: 'wrap' }}>
                      <input value={editName} onChange={e => setEditName(e.target.value)} style={{ ...inp, width: 160 }} placeholder="Display name" />
                      <select value={editRole} onChange={e => setEditRole(e.target.value as 'admin'|'member')} style={{ ...inp, width: 110 }}>
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                      <button onClick={() => handleSaveEdit(m.id)} style={{ height: 34, padding: '0 12px', borderRadius: 7, background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid var(--blue-bdr)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                      <button onClick={() => setEditId(null)} style={{ height: 34, padding: '0 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-dim)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--blue-bg)', border: '1px solid var(--blue-bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--blue)', flexShrink: 0 }}>
                        {(m.display_name || m.email)[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{m.display_name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{m.email}</div>
                      </div>
                      {(m as any).status === 'pending' ? (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 10, background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid var(--amber-bdr)' }}>
                          Pending approval
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 10, background: m.role === 'admin' ? 'var(--blue-bg)' : 'var(--bg-hover)', color: m.role === 'admin' ? 'var(--blue)' : 'var(--text-dim)', border: `1px solid ${m.role === 'admin' ? 'var(--blue-bdr)' : 'var(--border)'}` }}>
                          {m.role === 'admin' ? 'Admin' : 'Member'}
                        </span>
                      )}
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(m as any).status === 'pending' && (
                          <button onClick={() => handleApprove(m.id)} style={{ height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--green-bdr)', background: 'var(--green-bg)', color: 'var(--green)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✓ Approve</button>
                        )}
                        <button onClick={() => { setEditId(m.id); setEditName(m.display_name || ''); setEditRole(m.role) }} style={{ height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-dim)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                        {m.id !== me?.id && (
                          <button onClick={() => handleDelete(m.id, m.email)} style={{ height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--red-bdr)', background: 'transparent', color: 'var(--red)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Department assignments */}
          {projects.length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sub)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-sub)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Department assignments</div>
                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} style={{ ...inp, marginLeft: 'auto', width: 200 }}>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid var(--border-sub)', minWidth: 140 }}>Department</th>
                      {members.map(m => (
                        <th key={m.id} style={{ textAlign: 'center', padding: '8px 10px', fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, borderBottom: '1px solid var(--border-sub)', whiteSpace: 'nowrap' }}>
                          {m.display_name || m.email.split('@')[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(departments[selectedProject] || []).map(dept => (
                      <tr key={dept.id} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                        <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>{dept.full_name}</td>
                        {members.map(m => {
                          const assigned = assignments.some(a => a.team_member_id === m.id && a.department_id === dept.id)
                          return (
                            <td key={m.id} style={{ textAlign: 'center', padding: '10px' }}>
                              <button
                                onClick={() => toggleDeptAssign(m.id, dept.id)}
                                style={{ width: 22, height: 22, borderRadius: 5, border: `2px solid ${assigned ? 'var(--blue-mid)' : 'var(--border)'}`, background: assigned ? 'var(--blue-mid)' : 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                title={assigned ? `Remove ${m.display_name} from ${dept.full_name}` : `Assign ${m.display_name} to ${dept.full_name}`}
                              >
                                {assigned && <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</span>}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
