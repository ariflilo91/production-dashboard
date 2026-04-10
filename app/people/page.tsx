'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import TopNav from '@/components/TopNav'
import {
  getProjects, getTeamMembers, getTasksForMember, upsertTeamMember, deleteTeamMember,
  Project, TeamMember, Task,
} from '@/lib/supabase'
import { buildDays, buildMonthHeaders, workDayIndex, addDays, parseDate, formatDate, formatDateInput, isOffDay, getStageFull, STATUS_LABELS } from '@/lib/utils'

const COL_W = 28
const DEPT_ORDER = ['Management','Pre-production','Production','Post-production']
const DEPT_COLORS: Record<string,string> = {
  'Management':'#FBCA75', 'Pre-production':'#85B7EB', 'Production':'#97C459', 'Post-production':'#D4537E'
}
const BAR: Record<string, React.CSSProperties> = {
  done:     { background:'var(--bar-done-bg)',    color:'var(--bar-done-color)',    border:'1px solid var(--bar-done-bdr)'    },
  wip:      { background:'var(--bar-wip-bg)',     color:'var(--bar-wip-color)',     border:'1px solid var(--bar-wip-bdr)'     },
  review:   { background:'var(--bar-review-bg)',  color:'var(--bar-review-color)',  border:'1px solid var(--bar-review-bdr)'  },
  overdue:  { background:'var(--bar-overdue-bg)', color:'var(--bar-overdue-color)', border:'1px solid var(--bar-overdue-bdr)' },
  risk:     { background:'var(--bar-review-bg)',  color:'var(--bar-review-color)',  border:'1.5px solid var(--bar-overdue-bdr)'},
  upcoming: { background:'var(--bar-upcoming-bg)', color:'var(--bar-upcoming-color)', border:'1px solid var(--bar-upcoming-bdr)' },
}
const MEMBER_COLORS = ['#378ADD','#1D9E75','#D85A30','#7F77DD','#D4537E','#BA7517','#F09595','#FBCA75','#97C459','#85B7EB']

function defaultStart() { const d = new Date(); d.setDate(d.getDate()-28); d.setHours(12,0,0,0); return d }
function defaultEnd()   { const d = new Date(); d.setFullYear(d.getFullYear()+1); d.setHours(12,0,0,0); return d }

// ─── Member Form Modal ────────────────────────────────
function MemberModal({ member, onSave, onClose }: {
  member?: TeamMember | null
  onSave: (m: Partial<TeamMember>) => Promise<void>
  onClose: () => void
}) {
  const [name, setName]     = useState(member?.name ?? '')
  const [role, setRole]     = useState(member?.role ?? '')
  const [dept, setDept]     = useState(member?.department ?? 'Pre-production')
  const [color, setColor]   = useState(member?.color ?? MEMBER_COLORS[0])
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    await onSave({ id: member?.id, name: name.trim(), role: role.trim(), department: dept, color })
    setSaving(false)
    onClose()
  }

  const inp: React.CSSProperties = { width:'100%', height:36, padding:'0 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-hover)', color:'var(--text-primary)', fontSize:12, fontFamily:'inherit' }
  const lbl: React.CSSProperties = { fontSize:10, color:'var(--text-dim)', display:'block', marginBottom:5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em' }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}
      onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:24, width:'100%', maxWidth:380, boxShadow:'0 8px 40px rgba(0,0,0,0.4)' }}>
        <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:18 }}>
          {member ? 'Edit member' : 'Add team member'}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div><label style={lbl}>Name *</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Anis Syifa" style={inp} autoFocus /></div>
          <div><label style={lbl}>Role</label><input value={role} onChange={e=>setRole(e.target.value)} placeholder="e.g. Script Writer" style={inp} /></div>
          <div>
            <label style={lbl}>Department</label>
            <select value={dept} onChange={e=>setDept(e.target.value)} style={inp}>
              {DEPT_ORDER.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Colour</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {MEMBER_COLORS.map(c=>(
                <button key={c} onClick={()=>setColor(c)} style={{ width:26, height:26, borderRadius:'50%', background:c, cursor:'pointer', border:color===c?'3px solid var(--text-primary)':'3px solid transparent', transform:color===c?'scale(1.2)':'scale(1)', transition:'all 0.15s', outline:'none', flexShrink:0 }} />
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={save} disabled={saving||!name.trim()} style={{ flex:1, height:38, borderRadius:8, background:'var(--blue-bg)', color:'var(--blue)', border:'1px solid var(--blue-bdr)', fontSize:13, fontWeight:700, cursor:saving||!name.trim()?'not-allowed':'pointer', opacity:saving||!name.trim()?0.5:1, fontFamily:'inherit' }}>
              {saving?'Saving...':member?'Save changes':'Add member'}
            </button>
            <button onClick={onClose} style={{ height:38, padding:'0 16px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-dim)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Person Gantt Modal ───────────────────────────────
function PersonGantt({ member, projects, onClose }: { member: TeamMember; projects: Project[]; onClose: () => void }) {
  const [tasks, setTasks]   = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const today    = new Date()
  const viewStart = defaultStart()
  const viewEnd   = defaultEnd()
  const days      = buildDays(viewStart, viewEnd)
  const total     = days.length
  const todayI    = workDayIndex(days, today)

  useEffect(() => {
    getTasksForMember(member.id).then(t => { setTasks(t); setLoading(false) })
  }, [member.id])

  const months = buildMonthHeaders(days)

  const ov = tasks.filter(t=>t.status==='overdue').length
  const rk = tasks.filter(t=>t.status==='risk').length
  const wp = tasks.filter(t=>t.status==='wip'||t.status==='review').length
  const dn = tasks.filter(t=>t.status==='done').length

  // Group tasks by project
  const byProject: Record<string, Task[]> = {}
  tasks.forEach(t => {
    const pid = t.project_id
    if (!byProject[pid]) byProject[pid] = []
    byProject[pid].push(t)
  })

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', flexDirection:'column', zIndex:200, padding:20 }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div style={{ background:'var(--bg-base)', border:'1px solid var(--border)', borderRadius:14, flex:1, display:'flex', flexDirection:'column', maxHeight:'calc(100vh - 40px)', overflow:'hidden', boxShadow:'0 8px 48px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border-sub)', display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:member.color+'33', border:`2px solid ${member.color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:member.color, flexShrink:0 }}>
            {member.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)' }}>{member.name}</div>
            <div style={{ fontSize:11, color:'var(--text-dim)' }}>{member.role} · {member.department}</div>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:16 }}>
            {[{l:'Overdue',v:ov,c:ov>0?'var(--red)':'var(--text-dim)'},{l:'At risk',v:rk,c:rk>0?'var(--amber)':'var(--text-dim)'},{l:'Active',v:wp,c:'var(--blue)'},{l:'Done',v:dn,c:'var(--green)'}].map(({l,v,c})=>(
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:700, color:c, lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:9, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.06em', marginTop:2 }}>{l}</div>
              </div>
            ))}
            <button onClick={onClose} style={{ alignSelf:'flex-start', background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:20, padding:'0 4px', marginLeft:8 }}>✕</button>
          </div>
        </div>

        {/* Gantt */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? (
            <div style={{ color:'var(--text-dim)', textAlign:'center', padding:'40px 0', fontSize:13 }}>Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-faint)', fontSize:13 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
              No tasks assigned to {member.name} yet.
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ borderCollapse:'collapse', fontSize:11, minWidth:'100%' }}>
                <thead>
                  <tr>
                    <th style={{ position:'sticky', left:0, zIndex:8, background:'var(--bg-surface)', minWidth:200, maxWidth:200, padding:'7px 12px', textAlign:'left', fontSize:10, fontWeight:700, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'.06em', borderRight:'2px solid var(--border-sub)', borderBottom:'1px solid var(--border-sub)', boxShadow:'2px 0 4px rgba(0,0,0,0.15)' }} rowSpan={3}>
                      Task
                    </th>
                    {months.map((m,i) => (
                      <th key={i} colSpan={m.count} style={{ textAlign:'center', fontWeight:700, fontSize:10, padding:'6px 4px', background:'var(--bg-surface)', borderRight:'1px solid var(--border-sub)', borderBottom:'1px solid var(--border-dim)', color:'var(--text-dim)', whiteSpace:'nowrap' }}>
                        {m.label}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th style={{ position:'sticky', left:0, zIndex:8, background:'var(--bg-surface)', minWidth:200, maxWidth:200, borderRight:'1px solid var(--border-sub)', borderBottom:'1px solid var(--border-sub)' }} />
                    {days.map((day,i) => (
                      <th key={`dl${i}`} style={{ minWidth:COL_W, width:COL_W, textAlign:'center', fontSize:8, fontWeight:600, padding:'2px 1px', background:'var(--gantt-group-bg)', borderRight:'1px solid var(--border-dim)', borderBottom:'1px solid var(--border-sub)', color:'var(--text-faint)', letterSpacing:'.02em' }}>
                        {['M','T','W','T','F'][day.getDay() - 1]}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th style={{ position:'sticky', left:0, zIndex:8, background:'var(--bg-surface)', minWidth:200, maxWidth:200, borderRight:'1px solid var(--border-sub)', borderBottom:'1px solid var(--border-sub)' }} />
                    {days.map((day,i) => {
                      const isTd = i===todayI
                      return (
                        <th key={i} style={{ minWidth:COL_W, width:COL_W, textAlign:'center', fontSize:9, padding:'3px 1px', background:'var(--bg-base)', borderRight:'1px solid var(--border-dim)', borderBottom:'1px solid var(--border-sub)', color:isTd?'var(--blue)':'var(--text-faint)', fontWeight:isTd?700:400 }}>
                          {day.getDate()}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(byProject).map(([pid, ptasks]) => {
                    const proj = projects.find(p=>p.id===pid)
                    return [
                      // Project group header
                      <tr key={`proj-${pid}`}>
                        <td colSpan={total+1} style={{ padding:'5px 12px', background:'var(--gantt-group-bg)', fontSize:9, fontWeight:700, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'.09em', borderBottom:'1px solid var(--border-sub)', position:'sticky', left:0, zIndex:2 }}>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                            {proj && <span style={{ width:8, height:8, borderRadius:'50%', background:proj.color, display:'inline-block' }} />}
                            {proj?.name ?? 'Unknown project'}
                          </span>
                        </td>
                      </tr>,
                      // Task rows
                      ...ptasks.map(task => {
                        const s = Math.max(0, workDayIndex(days, parseDate(task.start_date)))
                        const e = Math.min(total-1, workDayIndex(days, parseDate(task.end_date)))
                        const span = Math.max(1, e-s+1)
                        const barStyle = BAR[task.status] ?? BAR.upcoming

                        return (
                          <tr key={task.id} style={{ borderBottom:'1px solid var(--border-dim)' }}>
                            <td style={{ position:'sticky', left:0, zIndex:4, background:'var(--bg-card)', padding:'0 12px', minWidth:200, maxWidth:200, height:36, verticalAlign:'middle', borderRight:'2px solid var(--border-sub)', boxShadow:'2px 0 6px rgba(0,0,0,0.2)' }}>
                              <div style={{ fontSize:11, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {task.department?.full_name}
                              </div>
                              <div style={{ fontSize:9, color:'var(--text-faint)' }}>
                                {task.episode?.name} · {task.stage_code}
                              </div>
                            </td>

                            {Array.from({ length: total }).map((_,i) => {
                              const isTd = i===todayI
                              if (i===s) {
                                return (
                                  <td key={i} colSpan={span} style={{ padding:'0 2px', height:36, verticalAlign:'middle', position:'relative', background:isTd?'var(--gantt-today-bg)':'transparent' }}>
                                    {isTd && <div style={{ position:'absolute', top:0, bottom:0, left:'50%', width:1.5, background:'var(--blue-mid)', opacity:0.7, transform:'translateX(-50%)', pointerEvents:'none', zIndex:5 }} />}
                                    <div style={{ height:22, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, padding:'0 8px', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', ...barStyle }}>
                                      {task.episode?.name}
                                    </div>
                                  </td>
                                )
                              }
                              if (i>s && i<=e) return null
                              return (
                                <td key={i} style={{ minWidth:COL_W, width:COL_W, height:36, padding:0, position:'relative', borderRight:'1px solid var(--border-dim)', background:isTd?'var(--gantt-today-bg)':'transparent' }}>
                                  {isTd && <div style={{ position:'absolute', top:0, bottom:0, left:'50%', width:1.5, background:'var(--blue-mid)', opacity:0.7, transform:'translateX(-50%)', pointerEvents:'none', zIndex:5 }} />}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })
                    ]
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main People Page ─────────────────────────────────
export default function PeoplePage() {
  const [projects, setProjects]     = useState<Project[]>([])
  const [members, setMembers]       = useState<TeamMember[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [selected, setSelected]     = useState<TeamMember | null>(null)
  const [editMember, setEditMember] = useState<TeamMember | null | undefined>(undefined)
  const [showAdd, setShowAdd]       = useState(false)

  useEffect(() => {
    async function load() {
      // Load projects first — always needed for sidebar
      const projs = await getProjects()
      setProjects(projs)
      // Load team members separately so errors don't block projects
      try {
        const mems = await getTeamMembers()
        console.log('Team members loaded:', mems.length, mems)
        setMembers(mems)
      } catch(e) {
        console.error('Could not load team members:', e)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSaveMember(m: Partial<TeamMember>) {
    const saved = await upsertTeamMember(m)
    setMembers(prev => {
      const idx = prev.findIndex(x=>x.id===saved.id)
      if (idx>=0) { const a=[...prev]; a[idx]=saved; return a }
      return [...prev, saved].sort((a,b)=>a.name.localeCompare(b.name))
    })
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name} from the team?`)) return
    await deleteTeamMember(id)
    setMembers(prev=>prev.filter(m=>m.id!==id))
  }

  const filtered = members.filter(m => {
    const s = search.toLowerCase()
    const matchSearch = !s || m.name.toLowerCase().includes(s) || m.role.toLowerCase().includes(s)
    const matchDept   = !filterDept || m.department === filterDept
    return matchSearch && matchDept
  })

  const grouped = DEPT_ORDER.reduce((acc, d) => {
    const g = filtered.filter(m=>m.department===d)
    if (g.length) acc[d] = g
    return acc
  }, {} as Record<string, TeamMember[]>)

  const sidebarProjects = projects.map(p=>({ id:p.id, name:p.name, color:p.color }))

  const inp: React.CSSProperties = { height:30, padding:'0 10px', borderRadius:7, border:'1px solid var(--border)', background:'var(--bg-hover)', color:'var(--text-primary)', fontSize:11, fontFamily:'inherit' }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg-base)' }}>
      <Sidebar projects={sidebarProjects} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <TopNav
          breadcrumbs={[{ label:'People' }]}
          actions={
            <button onClick={()=>setShowAdd(true)} style={{ height:28, padding:'0 14px', borderRadius:7, background:'var(--blue-bg)', color:'var(--blue)', border:'1px solid var(--blue-bdr)', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              + Add member
            </button>
          }
        />

        <div style={{ padding:20, overflowY:'auto', flex:1 }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>People</div>
              <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>{members.length} team member{members.length!==1?'s':''} · click a person to see their tasks</div>
            </div>
            <div style={{ marginLeft:'auto', display:'flex', gap:8, flexWrap:'wrap' }}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or role..." style={{ ...inp, width:180 }} />
              <select value={filterDept} onChange={e=>setFilterDept(e.target.value)} style={inp}>
                <option value="">All departments</option>
                {DEPT_ORDER.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ color:'var(--text-dim)', textAlign:'center', padding:'60px 0' }}>Loading team...</div>
          ) : (
            Object.entries(grouped).map(([dept, group]) => (
              <div key={dept} style={{ marginBottom:28 }}>
                {/* Dept header */}
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <div style={{ width:10, height:10, borderRadius:3, background:DEPT_COLORS[dept]??'var(--text-faint)', flexShrink:0 }} />
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'.09em' }}>{dept}</div>
                  <div style={{ fontSize:10, color:'var(--text-faint)', background:'var(--bg-hover)', border:'1px solid var(--border)', borderRadius:10, padding:'1px 8px' }}>{group.length}</div>
                </div>

                {/* Member cards grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:10 }}>
                  {group.map(m => (
                    <div key={m.id}
                      onClick={()=>setSelected(m)}
                      style={{ background:'var(--bg-card)', border:`1px solid var(--border-sub)`, borderRadius:12, padding:'14px 16px', cursor:'pointer', transition:'all 0.15s', position:'relative' }}
                    >
                      {/* Avatar */}
                      <div style={{ width:44, height:44, borderRadius:'50%', background:m.color+'22', border:`2px solid ${m.color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:m.color, marginBottom:10 }}>
                        {m.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>{m.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-dim)' }}>{m.role}</div>

                      {/* Edit / delete buttons */}
                      <div style={{ position:'absolute', top:10, right:10, display:'flex', gap:4 }} onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>setEditMember(m)} style={{ width:24, height:24, borderRadius:5, border:'1px solid var(--border)', background:'var(--bg-hover)', color:'var(--text-dim)', cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center' }} title="Edit">✎</button>
                        <button onClick={()=>handleDelete(m.id, m.name)} style={{ width:24, height:24, borderRadius:5, border:'1px solid var(--red-bdr)', background:'transparent', color:'var(--red)', cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center' }} title="Remove">✕</button>
                      </div>

                      {/* View tasks hint */}
                      <div style={{ marginTop:10, paddingTop:8, borderTop:'1px solid var(--border-dim)', fontSize:10, color:'var(--blue)', fontWeight:600 }}>
                        View tasks →
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {!loading && filtered.length===0 && (
            <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-faint)', fontSize:13 }}>No members match your search.</div>
          )}
        </div>
      </div>

      {/* Person Gantt modal */}
      {selected && (
        <PersonGantt member={selected} projects={projects} onClose={()=>setSelected(null)} />
      )}

      {/* Add member modal */}
      {showAdd && (
        <MemberModal onSave={handleSaveMember} onClose={()=>setShowAdd(false)} />
      )}

      {/* Edit member modal */}
      {editMember !== undefined && editMember !== null && (
        <MemberModal member={editMember} onSave={handleSaveMember} onClose={()=>setEditMember(undefined)} />
      )}
    </div>
  )
}
