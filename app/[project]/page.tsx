'use client'
import { useEffect, useState, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
import TopNav from '@/components/TopNav'
import { StatCard } from '@/components/UI'
import {
  supabase, getProjects, getEpisodes, getDepartments, getTasks, getHolidays,
  upsertTask, deleteTask as dbDeleteTask, upsertHoliday, deleteHoliday,
  createEpisode, deleteEpisode,
  Project, Episode, Department, Task, Holiday,
} from '@/lib/supabase'
import {
  buildDays, dayDiff, addDays, parseDate, formatDate, formatDateInput,
  isOffDay, getStageFull, DEPT_STAGES, STATUS_LABELS,
} from '@/lib/utils'

const COL_W = 28

const GROUPS = [
  { label: 'Pre-production',  depts: ['Script', 'Storyboard', 'Concept', 'Modeling'] },
  { label: 'Production',      depts: ['Animation', 'Recording', 'Scoring', 'Mixing'] },
  { label: 'Post-production', depts: ['Render', 'Comp'] },
]

// Fix 1: Upcoming is now a visible warm gray-blue, all bars readable
const BAR: Record<string, React.CSSProperties> = {
  done:     { background: '#0a1e0a', color: '#97C459', border: '1px solid #183018' },
  wip:      { background: '#071828', color: '#85B7EB', border: '1px solid #0d2a48' },
  review:   { background: '#1e1408', color: '#FBCA75', border: '1px solid #3a2808' },
  overdue:  { background: '#1e0808', color: '#F09595', border: '1px solid #3a1010' },
  risk:     { background: '#1e1408', color: '#FBCA75', border: '1.5px solid #F09595' },
  upcoming: { background: '#1a1a2e', color: '#9b9bc8', border: '1px solid #2a2a52' }, // Fix 1: more visible
}

const inp: React.CSSProperties = {
  height: 28, padding: '0 10px', borderRadius: 7,
  border: '1px solid #2a2a27', background: '#161614',
  color: '#e8e6df', fontSize: 11, fontFamily: 'inherit',
}

const modalInp: React.CSSProperties = {
  width: '100%', height: 34, padding: '0 10px', borderRadius: 7,
  border: '1px solid #2a2a27', background: '#1a1a18',
  color: '#e8e6df', fontSize: 12, fontFamily: 'inherit',
}

const lbl: React.CSSProperties = {
  fontSize: 10, color: '#888780', display: 'block', marginBottom: 4,
  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em',
}

// ─── Holidays Modal ───────────────────────────────────
function HolidaysModal({ holidays, projectId, onAdd, onRemove, onClose }: {
  holidays: Holiday[]; projectId: string
  onAdd: (h: Holiday) => void; onRemove: (id: string) => void; onClose: () => void
}) {
  const [date, setDate]     = useState('')
  const [name, setName]     = useState('')
  const [type, setType]     = useState<'ph' | 'sl'>('ph')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function add() {
    if (!date || !name.trim()) { setError('Please fill in date and name.'); return }
    setSaving(true)
    try {
      const saved = await upsertHoliday({ project_id: projectId, date, name: name.trim(), type })
      onAdd(saved); setDate(''); setName(''); setError('')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error') }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#161614', border: '1px solid #2a2a27', borderRadius: 14, padding: 24, width: '100%', maxWidth: 500, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 48px rgba(0,0,0,.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e8e6df' }}>Holidays &amp; special leave</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888780', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 14 }}>
          {holidays.length === 0
            ? <div style={{ fontSize: 12, color: '#5F5E5A', padding: '16px 0', textAlign: 'center' }}>No holidays added yet.</div>
            : [...holidays].sort((a, b) => a.date.localeCompare(b.date)).map(h => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: '#111110', marginBottom: 5, borderLeft: `3px solid ${h.type === 'ph' ? '#854F0B' : '#534AB7'}` }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#c8c6bf', minWidth: 90 }}>
                  {new Date(h.date + 'T12:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span style={{ flex: 1, fontSize: 11, color: '#888780' }}>{h.name}</span>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: h.type === 'ph' ? '#231a0a' : '#1a0a2a', color: h.type === 'ph' ? '#FBCA75' : '#AFA9EC', whiteSpace: 'nowrap' }}>
                  {h.type === 'ph' ? 'Public holiday' : 'Special leave'}
                </span>
                <button onClick={() => { deleteHoliday(h.id); onRemove(h.id) }} style={{ background: 'none', border: 'none', color: '#F09595', cursor: 'pointer', fontSize: 14 }}>✕</button>
              </div>
            ))
          }
        </div>
        <div style={{ borderTop: '1px solid #222220', paddingTop: 14 }}>
          <div style={{ fontSize: 10, color: '#888780', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Add day off</div>
          {error && <div style={{ fontSize: 11, color: '#F09595', marginBottom: 8 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...modalInp, width: 140 }} />
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Holiday name or reason" style={{ ...modalInp, flex: 1, minWidth: 130 }} />
            <select value={type} onChange={e => setType(e.target.value as 'ph' | 'sl')} style={{ ...modalInp, width: 130 }}>
              <option value="ph">Public holiday</option>
              <option value="sl">Special leave</option>
            </select>
            <button onClick={add} disabled={saving} style={{ height: 34, padding: '0 16px', borderRadius: 7, background: '#0d2a45', color: '#85B7EB', border: '1px solid #1a4060', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {saving ? '...' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Episode Manager Modal ────────────────────────────
function EpisodeModal({ episodes, projectId, onAdd, onDelete, onClose }: {
  episodes: Episode[]; projectId: string
  onAdd: (e: Episode) => void; onDelete: (id: string) => void; onClose: () => void
}) {
  const [newName, setNewName] = useState('')
  const [newDate, setNewDate] = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  async function add() {
    if (!newName.trim()) { setError('Please enter an episode name.'); return }
    setSaving(true)
    try {
      const ep = await createEpisode(projectId, newName.trim(), newDate || undefined)
      onAdd(ep); setNewName(''); setNewDate(''); setError('')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error') }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#161614', border: '1px solid #2a2a27', borderRadius: 14, padding: 24, width: '100%', maxWidth: 440, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 48px rgba(0,0,0,.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e8e6df' }}>Manage episodes</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888780', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 14 }}>
          {episodes.length === 0
            ? <div style={{ fontSize: 12, color: '#5F5E5A', padding: '16px 0', textAlign: 'center' }}>No episodes yet. Add one below.</div>
            : episodes.map(ep => (
              <div key={ep.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: '#111110', marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#e8e6df', flex: 1 }}>{ep.name}</span>
                {ep.air_date && <span style={{ fontSize: 10, color: '#888780' }}>{ep.air_date}</span>}
                <button onClick={() => {
                  if (confirm(`Delete ${ep.name}? This will also delete all its tasks.`)) {
                    deleteEpisode(ep.id); onDelete(ep.id)
                  }
                }} style={{ background: 'none', border: 'none', color: '#F09595', cursor: 'pointer', fontSize: 14 }}>✕</button>
              </div>
            ))
          }
        </div>
        <div style={{ borderTop: '1px solid #222220', paddingTop: 14 }}>
          <div style={{ fontSize: 10, color: '#888780', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Add new episode</div>
          {error && <div style={{ fontSize: 11, color: '#F09595', marginBottom: 8 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="e.g. Ep 10" style={{ ...modalInp, flex: 1, minWidth: 100 }} autoFocus />
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} title="Target air date (optional)" style={{ ...modalInp, width: 140 }} />
            <button onClick={add} disabled={saving} style={{ height: 34, padding: '0 16px', borderRadius: 7, background: '#0a1e0a', color: '#97C459', border: '1px solid #183018', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {saving ? '...' : '+ Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Task Modal ───────────────────────────────────────
function TaskModal({ modal, departments, episodes, onSave, onDelete, onClose }: {
  modal: { type: 'edit' | 'add'; task?: Task; deptId?: string }
  departments: Department[]; episodes: Episode[]
  onSave: (data: Partial<Task>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}) {
  const task = modal.task
  const [deptId, setDeptId]   = useState(task?.department_id || modal.deptId || departments[0]?.id || '')
  const [epId, setEpId]       = useState(task?.episode_id || episodes[0]?.id || '')
  const [stage, setStage]     = useState(task?.stage_code || '')
  const [status, setStatus]   = useState<Task['status']>(task?.status || 'upcoming')
  const [startDate, setStart] = useState(task?.start_date || '')
  const [endDate, setEnd]     = useState(task?.end_date || '')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const dept   = departments.find(d => d.id === deptId)
  const stages = dept ? (DEPT_STAGES[dept.name] || []) : []

  useEffect(() => { if (stages.length && !stage) setStage(stages[0]) }, [deptId])

  async function save() {
    if (!startDate || !endDate) { setError('Please select start and end dates.'); return }
    setSaving(true); setError('')
    try {
      await onSave({ id: task?.id, department_id: deptId, episode_id: epId, stage_code: stage, status, start_date: startDate, end_date: endDate })
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to save.'); setSaving(false) }
  }

  async function remove() {
    if (!task?.id) return
    setSaving(true)
    try { await onDelete(task.id) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to delete.'); setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#161614', border: '1px solid #2a2a27', borderRadius: 14, padding: 24, width: '100%', maxWidth: 420, boxShadow: '0 8px 48px rgba(0,0,0,.5)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: '#e8e6df' }}>
          {modal.type === 'edit' ? `${dept?.full_name || ''} — ${task?.episode?.name || ''}` : 'Add new task'}
        </div>

        {modal.type === 'add' && (
          <>
            <label style={lbl}>Department</label>
            <select value={deptId} onChange={e => { setDeptId(e.target.value); setStage('') }} style={{ ...modalInp, marginBottom: 12 }}>
              {departments.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
            <label style={lbl}>Episode</label>
            <select value={epId} onChange={e => setEpId(e.target.value)} style={{ ...modalInp, marginBottom: 12 }}>
              {episodes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </>
        )}

        <label style={lbl}>Stage</label>
        <select value={stage} onChange={e => setStage(e.target.value)} style={{ ...modalInp, marginBottom: 12 }}>
          {stages.map(s => <option key={s} value={s}>{s} — {getStageFull(dept?.name || '', s)}</option>)}
        </select>

        <label style={lbl}>Status</label>
        <select value={status} onChange={e => setStatus(e.target.value as Task['status'])} style={{ ...modalInp, marginBottom: 12 }}>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div>
            <label style={lbl}>Start date</label>
            <input type="date" value={startDate} onChange={e => setStart(e.target.value)} style={modalInp} />
          </div>
          <div>
            <label style={lbl}>End date</label>
            <input type="date" value={endDate} onChange={e => setEnd(e.target.value)} style={modalInp} />
          </div>
        </div>

        {error && <div style={{ background: '#2a0808', border: '1px solid #3a1010', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#F09595', marginBottom: 14 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} disabled={saving} style={{ flex: 1, height: 38, borderRadius: 8, background: '#0d2a45', color: '#85B7EB', border: '1px solid #1a4060', fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          {modal.type === 'edit' && task && (
            <button onClick={remove} disabled={saving} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid #3a1010', color: '#F09595', background: 'transparent', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
          )}
          <button onClick={onClose} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid #2a2a27', background: 'transparent', color: '#a8a6a0', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────
export default function ProjectPage({ params }: { params: { project: string } }) {
  const projectId = params.project
  const [allProjects, setAllProjects]   = useState<Project[]>([])
  const [project, setProject]           = useState<Project | null>(null)
  const [episodes, setEpisodes]         = useState<Episode[]>([])
  const [departments, setDepartments]   = useState<Department[]>([])
  const [tasks, setTasks]               = useState<Task[]>([])
  const [holidays, setHolidays]         = useState<Holiday[]>([])
  const [loading, setLoading]           = useState(true)
  // Fix 3: default range is Jan 2026 – Jan 2027
  const [viewStart, setViewStart]       = useState(new Date('2026-01-01T12:00:00'))
  const [viewEnd, setViewEnd]           = useState(new Date('2027-01-01T12:00:00'))
  const [filterDept, setFilterDept]     = useState('')
  // Fix 4: filter by episode instead of status
  const [filterEp, setFilterEp]         = useState('')
  const [tooltip, setTooltip]           = useState<{ x: number; y: number; task: Task; dept: Department } | null>(null)
  const [modal, setModal]               = useState<{ type: 'edit' | 'add'; task?: Task; deptId?: string } | null>(null)
  const [showHolidays, setShowHolidays] = useState(false)
  const [showEpisodes, setShowEpisodes] = useState(false)
  const today = new Date()
  const dragRef = useRef<{ id: string; side: 'l' | 'r'; startX: number; origStart: Date; origEnd: Date; lastCols: number } | null>(null)

  useEffect(() => {
    async function load() {
      const { data: proj } = await supabase.from('projects').select('*').eq('id', projectId).single()
      const [projs, eps, depts, tks, hols] = await Promise.all([
        getProjects(), getEpisodes(projectId), getDepartments(projectId),
        getTasks(projectId), getHolidays(projectId),
      ])
      setProject(proj); setAllProjects(projs); setEpisodes(eps)
      setDepartments(depts); setTasks(tks); setHolidays(hols); setLoading(false)
    }
    load()
  }, [projectId])

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragRef.current) return
      const cols = Math.round((e.clientX - dragRef.current.startX) / COL_W)
      if (cols === dragRef.current.lastCols) return
      dragRef.current.lastCols = cols
      const { id, side, origStart, origEnd } = dragRef.current
      setTasks(prev => prev.map(t => {
        if (t.id !== id) return t
        const clone = { ...t }
        if (side === 'r') { const nd = addDays(origEnd, cols); clone.end_date = formatDateInput(nd < origStart ? origStart : nd) }
        else { const nd = addDays(origStart, cols); clone.start_date = formatDateInput(nd > origEnd ? origEnd : nd) }
        return clone
      }))
    }
    const up = () => { dragRef.current = null }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [])

  if (loading || !project) return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0e0e0c', color: '#888780' }}>Loading...</div>
  )

  const days    = buildDays(viewStart, viewEnd)
  const total   = days.length
  const todayI  = dayDiff(viewStart, today)
  const sidebarProjects = allProjects.map(p => ({ id: p.id, name: p.name, color: p.color }))

  // Fix 4: filter by episode
  const filteredTasks = tasks.filter(t => {
    if (filterDept) { const d = departments.find(d => d.id === t.department_id); if (!d || d.name !== filterDept) return false }
    if (filterEp && t.episode_id !== filterEp) return false
    return true
  })

  const ov = tasks.filter(t => t.status === 'overdue').length
  const rk = tasks.filter(t => t.status === 'risk').length
  const wp = tasks.filter(t => t.status === 'wip' || t.status === 'review').length
  const dn = tasks.filter(t => t.status === 'done').length

  const months: { label: string; count: number }[] = []
  days.forEach(day => {
    const lbl2 = day.toLocaleString('en', { month: 'short', year: 'numeric' })
    if (!months.length || months[months.length - 1].label !== lbl2) months.push({ label: lbl2, count: 1 })
    else months[months.length - 1].count++
  })

  // Fix 5: holiday column helpers
  const holidayMap: Record<string, Holiday> = {}
  holidays.forEach(h => { holidayMap[h.date] = h })

  async function saveTask(data: Partial<Task>) {
    const saved = await upsertTask({ ...data, project_id: projectId } as Task & { project_id: string })
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === saved.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = { ...saved, department: prev[idx]?.department, episode: prev[idx]?.episode }; return n }
      return [...prev, saved]
    })
    setModal(null)
  }

  async function removeTask(id: string) {
    await dbDeleteTask(id)
    setTasks(prev => prev.filter(t => t.id !== id))
    setModal(null)
  }

  function getDeptByName(name: string) { return departments.find(d => d.name === name) }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0e0e0c' }}>
      <Sidebar projects={sidebarProjects} activeProjectId={projectId} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopNav
          breadcrumbs={[{ label: 'Projects' }, { label: project.name }, { label: 'Timeline' }]}
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => setShowEpisodes(true)} style={{ ...inp, cursor: 'pointer' }}>Episodes</button>
              <button onClick={() => setShowHolidays(true)} style={{ ...inp, cursor: 'pointer' }}>Holidays</button>
              <button onClick={() => setModal({ type: 'add' })} style={{ height: 28, padding: '0 14px', borderRadius: 7, background: '#0a1e0a', color: '#97C459', border: '1px solid #183018', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                + Add task
              </button>
            </div>
          }
        />

        <div style={{ padding: '14px 20px', overflowY: 'auto', flex: 1 }}>
          {/* Fix 4: dept filter + episode filter (replacing status filter) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={inp}>
              <option value="">All departments</option>
              {departments.map(d => <option key={d.id} value={d.name}>{d.full_name}</option>)}
            </select>
            <select value={filterEp} onChange={e => setFilterEp(e.target.value)} style={inp}>
              <option value="">All episodes</option>
              {episodes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <div style={{ width: 1, height: 18, background: '#2a2a27' }} />
            <span style={{ fontSize: 11, color: '#888780' }}>From</span>
            <input type="date" value={formatDateInput(viewStart)} onChange={e => setViewStart(parseDate(e.target.value))} style={inp} />
            <span style={{ fontSize: 11, color: '#888780' }}>to</span>
            {/* Fix 3: default end date shown as Jan 2027 */}
            <input type="date" value={formatDateInput(viewEnd)} onChange={e => setViewEnd(parseDate(e.target.value))} style={inp} />
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
            {Object.entries(STATUS_LABELS).map(([k]) => {
              const s = BAR[k]; if (!s) return null
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#a8a6a0', fontWeight: 500 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: s.background as string, border: s.border as string }} />
                  {STATUS_LABELS[k]}
                </div>
              )
            })}
            <div style={{ marginLeft: 'auto', fontSize: 10, color: '#5F5E5A', fontStyle: 'italic' }}>
              Drag edges to resize · Click bar to edit
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
            <StatCard label="Overdue"     value={ov} sub="past due"  color={ov > 0 ? 'red' : 'default'} />
            <StatCard label="At risk"     value={rk} sub="need attn" color={rk > 0 ? 'amber' : 'default'} />
            <StatCard label="In progress" value={wp} sub="active"    color="blue" />
            <StatCard label="Done"        value={dn} sub="completed" color="green" />
          </div>

          {/* Gantt */}
          <div style={{ border: '1px solid #222220', borderRadius: 10, overflow: 'hidden', background: '#111110' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 11, minWidth: '100%' }}>
                <thead>
                  <tr>
                    <th rowSpan={2} style={{ position: 'sticky', left: 0, zIndex: 8, background: '#111110', minWidth: 150, maxWidth: 150, padding: '7px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#888780', textTransform: 'uppercase', letterSpacing: '.06em', borderRight: '1px solid #222220', borderBottom: '1px solid #222220' }}>
                      Department
                    </th>
                    {months.map((m, i) => (
                      <th key={i} colSpan={m.count} style={{ textAlign: 'center', fontWeight: 700, fontSize: 10, padding: '6px 4px', background: '#111110', borderRight: '1px solid #1e1e1c', borderBottom: '1px solid #222220', color: '#888780', whiteSpace: 'nowrap' }}>
                        {m.label}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {days.map((day, i) => {
                      const off = isOffDay(day, holidays)
                      const isTd = i === todayI
                      // Fix 5: holiday columns are orange-tinted with name tooltip
                      const isHoliday = off.off && off.type === 'ph'
                      const isLeave   = off.off && off.type === 'sl'
                      return (
                        <th
                          key={i}
                          title={off.name ?? ''}
                          style={{
                            minWidth: COL_W, width: COL_W, textAlign: 'center', fontSize: 9,
                            padding: '3px 1px', background: isHoliday ? '#2a1400' : isLeave ? '#1a1028' : '#0e0e0c',
                            borderRight: '1px solid #141412', borderBottom: '1px solid #222220',
                            color: isHoliday ? '#EF9F27' : isLeave ? '#9b7ec8' : isTd ? '#85B7EB' : off.off ? '#2a2a27' : '#555552',
                            fontWeight: isTd ? 700 : 400,
                            cursor: off.name ? 'help' : 'default',
                          }}
                        >
                          {day.getDate()}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {GROUPS.map(grp => {
                    const grpDepts = (filterDept ? grp.depts.filter(n => n === filterDept) : grp.depts)
                      .map(name => getDeptByName(name)).filter(Boolean) as Department[]
                    if (!grpDepts.length) return null
                    return [
                      <tr key={grp.label}>
                        <td colSpan={total + 1} style={{ padding: '5px 10px', background: '#0e0e0c', fontSize: 9, fontWeight: 700, color: '#5F5E5A', textTransform: 'uppercase', letterSpacing: '.09em', borderBottom: '1px solid #141412', position: 'sticky', left: 0, zIndex: 2 }}>
                          {grp.label}
                        </td>
                      </tr>,
                      ...grpDepts.map(dept =>
                        episodes.map((ep, epIdx) => {
                          const tsk = filteredTasks.find(t => t.department_id === dept.id && t.episode_id === ep.id)
                          const hasAny = tasks.find(t => t.department_id === dept.id && t.episode_id === ep.id)
                          const s = tsk ? Math.max(0, dayDiff(viewStart, parseDate(tsk.start_date))) : -1
                          const e = tsk ? Math.min(total - 1, dayDiff(viewStart, parseDate(tsk.end_date))) : -1
                          const span = tsk ? Math.max(1, e - s + 1) : 1
                          const barStyle = tsk ? BAR[tsk.status] : {}

                          return (
                            <tr key={`${dept.id}-${ep.id}`} style={{ borderBottom: '1px solid #141412' }}>
                              {epIdx === 0 && (
                                <td rowSpan={episodes.length} style={{ position: 'sticky', left: 0, zIndex: 2, background: '#111110', padding: '0 10px', minWidth: 150, maxWidth: 150, verticalAlign: 'middle', borderRight: '1px solid #222220' }}>
                                  <div style={{ fontSize: 11, fontWeight: hasAny ? 700 : 400, color: hasAny ? '#c8c6bf' : '#555552', fontStyle: hasAny ? 'normal' : 'italic', lineHeight: 1.3 }}>
                                    {dept.full_name}
                                    {!hasAny && <span style={{ fontSize: 9, color: '#3a3a37', display: 'block', marginTop: 1 }}>no data</span>}
                                  </div>
                                </td>
                              )}

                              {Array.from({ length: total }).map((_, i) => {
                                const off     = isOffDay(days[i], holidays)
                                const isTd    = i === todayI
                                const isHol   = off.off && off.type === 'ph'
                                const isSL    = off.off && off.type === 'sl'
                                const isWknd  = off.off && off.type === 'weekend'

                                // Fix 5: holiday cells are clearly orange-blocked
                                const cellBg = isHol
                                  ? 'rgba(180,80,0,0.18)'
                                  : isSL
                                    ? 'rgba(100,60,180,0.15)'
                                    : isWknd
                                      ? 'repeating-linear-gradient(135deg,transparent,transparent 3px,rgba(255,255,255,.018) 3px,rgba(255,255,255,.018) 6px)'
                                      : 'transparent'

                                const cellBorder = isHol ? '1px solid rgba(180,100,0,0.3)' : isSL ? '1px solid rgba(100,60,180,0.25)' : '1px solid #141412'

                                if (tsk && i === s) {
                                  return (
                                    <td key={i} colSpan={span} style={{ padding: '0 2px', height: 36, verticalAlign: 'middle', position: 'relative', background: isTd ? 'rgba(55,138,221,0.06)' : isHol ? 'rgba(180,80,0,0.10)' : 'transparent' }}>
                                      {isTd && <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1.5, background: '#378ADD', opacity: 0.6, transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 5 }} />}
                                      <div
                                        style={{ height: 22, borderRadius: 5, display: 'flex', alignItems: 'center', position: 'relative', cursor: 'pointer', userSelect: 'none', ...barStyle }}
                                        onClick={() => setModal({ type: 'edit', task: tsk })}
                                        onMouseEnter={ev => setTooltip({ x: ev.clientX, y: ev.clientY, task: tsk, dept })}
                                        onMouseLeave={() => setTooltip(null)}
                                        onMouseMove={ev => setTooltip(t => t ? { ...t, x: ev.clientX, y: ev.clientY } : null)}
                                      >
                                        {/* Fix 1: drag handles visible on both sides */}
                                        <div
                                          onMouseDown={ev => { ev.stopPropagation(); ev.preventDefault(); dragRef.current = { id: tsk.id, side: 'l', startX: ev.clientX, origStart: parseDate(tsk.start_date), origEnd: parseDate(tsk.end_date), lastCols: 0 } }}
                                          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 10, cursor: 'ew-resize', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                          <div style={{ width: 3, height: 12, borderRadius: 2, background: 'currentColor', opacity: 0.5 }} />
                                        </div>
                                        <div style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 700, padding: '0 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                                          {ep.name}
                                        </div>
                                        <div
                                          onMouseDown={ev => { ev.stopPropagation(); ev.preventDefault(); dragRef.current = { id: tsk.id, side: 'r', startX: ev.clientX, origStart: parseDate(tsk.start_date), origEnd: parseDate(tsk.end_date), lastCols: 0 } }}
                                          style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 10, cursor: 'ew-resize', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                          <div style={{ width: 3, height: 12, borderRadius: 2, background: 'currentColor', opacity: 0.5 }} />
                                        </div>
                                      </div>
                                    </td>
                                  )
                                }
                                if (tsk && i > s && i <= e) return null

                                return (
                                  <td key={i} style={{ minWidth: COL_W, width: COL_W, height: 36, padding: 0, position: 'relative', borderRight: cellBorder }}>
                                    <div style={{ position: 'absolute', inset: 0, background: cellBg }} />
                                    {/* Fix 5: show holiday name label at top of column */}
                                    {isHol && epIdx === 0 && (
                                      <div style={{
                                        position: 'absolute', top: 1, left: '50%', transform: 'translateX(-50%)',
                                        fontSize: 7, color: '#EF9F27', fontWeight: 700,
                                        whiteSpace: 'nowrap', letterSpacing: '.03em',
                                        writingMode: 'vertical-rl', textOrientation: 'mixed',
                                        maxHeight: 32, overflow: 'hidden', lineHeight: 1.1,
                                        zIndex: 2, opacity: 0.85,
                                      }}>
                                        {off.name}
                                      </div>
                                    )}
                                    {isTd && <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1.5, background: '#378ADD', opacity: 0.6, transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 5 }} />}
                                    {!hasAny && epIdx === 0 && i === Math.floor(total / 2) && (
                                      <div
                                        onClick={() => setModal({ type: 'add', deptId: dept.id })}
                                        style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', height: 20, padding: '0 8px', borderRadius: 4, border: '1px dashed #2a2a27', fontSize: 10, color: '#555552', display: 'flex', alignItems: 'center', cursor: 'pointer', whiteSpace: 'nowrap', zIndex: 2 }}
                                      >
                                        + add
                                      </div>
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })
                      ),
                    ]
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{ position: 'fixed', left: Math.min(tooltip.x + 14, window.innerWidth - 220), top: Math.min(tooltip.y - 10, window.innerHeight - 170), zIndex: 999, background: '#161614', border: '1px solid #2a2a27', borderRadius: 10, padding: '10px 14px', fontSize: 11, minWidth: 200, pointerEvents: 'none', boxShadow: '0 4px 24px rgba(0,0,0,.5)' }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#e8e6df', fontSize: 12 }}>{tooltip.dept.full_name} — {tooltip.task.episode?.name}</div>
          {[
            ['Stage', `${tooltip.task.stage_code} · ${getStageFull(tooltip.dept.name, tooltip.task.stage_code)}`],
            ['Status', STATUS_LABELS[tooltip.task.status]],
            ['Start', formatDate(parseDate(tooltip.task.start_date))],
            ['End', formatDate(parseDate(tooltip.task.end_date))],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
              <span style={{ color: '#888780' }}>{l}</span>
              <span style={{ fontWeight: 600, color: '#c8c6bf' }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {modal && <TaskModal modal={modal} departments={departments} episodes={episodes} onSave={saveTask} onDelete={removeTask} onClose={() => setModal(null)} />}
      {showHolidays && <HolidaysModal holidays={holidays} projectId={projectId} onAdd={h => setHolidays(prev => [...prev, h])} onRemove={id => setHolidays(prev => prev.filter(h => h.id !== id))} onClose={() => setShowHolidays(false)} />}
      {showEpisodes && <EpisodeModal episodes={episodes} projectId={projectId} onAdd={ep => setEpisodes(prev => [...prev, ep].sort((a, b) => a.name.localeCompare(b.name)))} onDelete={id => setEpisodes(prev => prev.filter(e => e.id !== id))} onClose={() => setShowEpisodes(false)} />}
    </div>
  )
}
