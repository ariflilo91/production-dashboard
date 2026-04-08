'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import TopNav from '@/components/TopNav'
import { StatCard, Badge, ProgressBar } from '@/components/UI'
import { getProjects, getTasks, createProject, Project, Task } from '@/lib/supabase'
import { parseDate } from '@/lib/utils'

const COLORS = ['#378ADD','#1D9E75','#D85A30','#7F77DD','#D4537E','#BA7517']

const inp: React.CSSProperties = {
  width: '100%', height: 36, padding: '0 12px', borderRadius: 8,
  border: '1px solid #2a2a27', background: '#1a1a18',
  color: '#e8e6df', fontSize: 12, fontFamily: 'inherit',
}

function buildMonths(start: Date, end: Date) {
  const months: { label: string; shortLabel: string; year: number; month: number }[] = []
  const cur = new Date(start.getFullYear(), start.getMonth(), 1)
  const endBound = new Date(end.getFullYear(), end.getMonth(), 1)
  while (cur <= endBound) {
    months.push({
      label: cur.toLocaleString('en', { month: 'long', year: 'numeric' }),
      shortLabel: cur.toLocaleString('en', { month: 'short' }),
      year: cur.getFullYear(),
      month: cur.getMonth(),
    })
    cur.setMonth(cur.getMonth() + 1)
  }
  return months
}

// New Project Modal
function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Project) => void }) {
  const router = useRouter()
  const [name, setName]     = useState('')
  const [code, setCode]     = useState('')
  const [color, setColor]   = useState(COLORS[0])
  const [status, setStatus] = useState('Active')
  const [notes, setNotes]   = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function handleCreate() {
    if (!name.trim()) { setError('Please enter a project name.'); return }
    setSaving(true); setError('')
    try {
      const p = await createProject({ name, code, color, status, notes })
      onCreated(p); router.push(`/${p.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create.')
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#161614', border: '1px solid #2a2a27', borderRadius: 14, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 8px 48px rgba(0,0,0,.6)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#e8e6df', marginBottom: 20 }}>New project</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 10, color: '#888780', display: 'block', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>Project / IP name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Durioo Friends Season 2" style={inp} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 10, color: '#888780', display: 'block', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>Project code</label>
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. DF-S2" style={{ ...inp, width: 180 }} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: '#888780', display: 'block', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>Colour</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: color === c ? '3px solid #e8e6df' : '3px solid transparent', transform: color === c ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.15s', outline: 'none' }} />
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, color: '#888780', display: 'block', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={inp}>
              {['Active','Planning','On hold','Completed'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, color: '#888780', display: 'block', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Broadcaster, delivery format, notes..." rows={3} style={{ ...inp, height: 'auto', padding: '8px 12px', resize: 'vertical', lineHeight: 1.6 }} />
          </div>
          {error && <div style={{ background: '#2a0808', border: '1px solid #3a1010', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#F09595' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleCreate} disabled={saving} style={{ flex: 1, height: 40, borderRadius: 9, background: '#0d2a45', color: '#85B7EB', border: '1px solid #1a4060', fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
              {saving ? 'Creating...' : 'Create project'}
            </button>
            <button onClick={onClose} style={{ height: 40, padding: '0 20px', borderRadius: 9, border: '1px solid #2a2a27', background: 'transparent', color: '#a8a6a0', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Fix 2: Master Timeline using absolute positioning overlay — seamless single bar
function MasterTimeline({ projects, projectTasks, taskCounts }: {
  projects: Project[]
  projectTasks: Record<string, Task[]>
  taskCounts: Record<string, Record<string, number>>
}) {
  const today      = new Date()
  const rangeStart = new Date(today.getFullYear(), today.getMonth() - 1, 1) // 1 month back, aligned to month start
  const rangeEnd   = new Date(today.getFullYear() + 1, today.getMonth(), 0)
  const months     = buildMonths(rangeStart, rangeEnd)
  const COL_W      = 80

  // Total timeline width in days
  const totalDays = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86400000) + 1

  function dateToPercent(date: Date): number {
    const clamped = new Date(Math.max(rangeStart.getTime(), Math.min(rangeEnd.getTime(), date.getTime())))
    return (clamped.getTime() - rangeStart.getTime()) / (rangeEnd.getTime() - rangeStart.getTime()) * 100
  }

  const todayPct = dateToPercent(today)
  const totalWidth = months.length * COL_W

  return (
    <div style={{ background: '#161614', border: '1px solid #222220', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #222220', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e6df' }}>Master timeline</div>
          <div style={{ fontSize: 11, color: '#5F5E5A', marginTop: 2 }}>
            One bar per project · Fill = % complete · {rangeStart.toLocaleString('en', { month: 'short', year: 'numeric' })} — {rangeEnd.toLocaleString('en', { month: 'short', year: 'numeric' })}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#888780' }}>
            <div style={{ width: 2, height: 14, background: '#85B7EB', borderRadius: 1 }} />
            Today
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#888780' }}>
            <div style={{ width: 22, height: 10, borderRadius: 3, background: 'rgba(55,138,221,0.2)', border: '1px solid rgba(55,138,221,0.4)', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '35%', background: '#378ADD', opacity: 0.8 }} />
            </div>
            Progress
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 180 + totalWidth }}>
          {/* Month header row */}
          <div style={{ display: 'flex', borderBottom: '1px solid #222220' }}>
            {/* Sticky project label */}
            <div style={{ minWidth: 180, width: 180, flexShrink: 0, padding: '8px 16px', fontSize: 10, fontWeight: 700, color: '#5F5E5A', textTransform: 'uppercase', letterSpacing: '.07em', borderRight: '1px solid #222220', background: '#161614' }}>
              Project
            </div>
            {/* Month columns */}
            {months.map((m, i) => {
              const isCurrent = m.year === today.getFullYear() && m.month === today.getMonth()
              return (
                <div key={i} style={{ minWidth: COL_W, width: COL_W, flexShrink: 0, textAlign: 'center', padding: '8px 4px', fontSize: 11, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#85B7EB' : '#888780', background: isCurrent ? 'rgba(55,138,221,0.06)' : 'transparent', borderRight: '1px solid #1e1e1c' }}>
                  {m.shortLabel}
                  <div style={{ fontSize: 9, color: isCurrent ? '#378ADD' : '#444441', marginTop: 1 }}>{m.year}</div>
                </div>
              )
            })}
          </div>

          {/* Project rows */}
          {projects.map((p, pi) => {
            const tasks = projectTasks[p.id] || []
            const c     = taskCounts[p.id] || {}
            const total = Math.max(c.total || 1, 1)
            const pct   = Math.round((c.done || 0) / total * 100)
            const ov    = c.overdue || 0
            const rk    = c.risk || 0

            const dates     = tasks.flatMap(t => [parseDate(t.start_date), parseDate(t.end_date)])
            const projStart = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : null
            const projEnd   = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : null

            const barColor  = ov > 0 ? '#E24B4A' : rk > 0 ? '#EF9F27' : p.color
            const leftPct   = projStart ? dateToPercent(projStart) : 0
            const rightPct  = projEnd   ? dateToPercent(projEnd)   : 0
            const widthPct  = rightPct - leftPct

            const ROW_H = 56

            return (
              <div key={p.id} style={{ display: 'flex', borderBottom: pi === projects.length - 1 ? 'none' : '1px solid #1a1a18', height: ROW_H }}>
                {/* Project label — sticky */}
                <div style={{ minWidth: 180, width: 180, flexShrink: 0, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8, borderRight: '1px solid #222220', background: '#161614' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#e8e6df', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    {p.code && <div style={{ fontSize: 10, color: '#5F5E5A', marginTop: 1 }}>{p.code}</div>}
                  </div>
                </div>

                {/* Timeline area — relative positioned, bars are absolute overlays */}
                <div style={{ flex: 1, position: 'relative', height: ROW_H }}>
                  {/* Month grid lines */}
                  {months.map((m, i) => {
                    const isCurrent = m.year === today.getFullYear() && m.month === today.getMonth()
                    return (
                      <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: i * COL_W, width: COL_W, borderRight: '1px solid #1a1a18', background: isCurrent ? 'rgba(55,138,221,0.03)' : 'transparent', pointerEvents: 'none' }} />
                    )
                  })}

                  {/* Fix 2: Single seamless bar — absolutely positioned across full span */}
                  {projStart && projEnd && widthPct > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '50%', transform: 'translateY(-50%)',
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      height: 34,
                      borderRadius: 8,
                      background: barColor + '22',
                      border: `1.5px solid ${barColor}55`,
                      overflow: 'hidden',
                      zIndex: 2,
                    }}>
                      {/* Completion fill */}
                      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${pct}%`, background: barColor, opacity: 0.5, transition: 'width 0.4s' }} />
                      {/* Label */}
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 11, fontWeight: 700, color: '#e8e6df', pointerEvents: 'none', whiteSpace: 'nowrap', overflow: 'hidden', zIndex: 1 }}>
                        {p.name} &nbsp;<span style={{ fontWeight: 400, color: barColor, opacity: 0.9 }}>{pct}%</span>
                      </div>
                    </div>
                  )}

                  {/* No tasks placeholder */}
                  {(!projStart || !projEnd) && (
                    <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 12, fontSize: 11, color: '#333332', fontStyle: 'italic' }}>No tasks yet</div>
                  )}

                  {/* Today line */}
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${todayPct}%`, width: 2, background: '#85B7EB', opacity: 0.75, zIndex: 5, pointerEvents: 'none' }} />
                </div>
              </div>
            )
          })}

          {projects.length === 0 && (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#5F5E5A', fontSize: 13 }}>No projects yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MasterDashboard() {
  const [projects, setProjects]             = useState<Project[]>([])
  const [taskCounts, setTaskCounts]         = useState<Record<string, Record<string, number>>>({})
  const [projectTasks, setProjectTasks]     = useState<Record<string, Task[]>>({})
  const [loading, setLoading]               = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const projs = await getProjects()
    setProjects(projs)
    const counts: Record<string, Record<string, number>> = {}
    const tByP:   Record<string, Task[]>                 = {}
    await Promise.all(projs.map(async p => {
      const tasks = await getTasks(p.id)
      const c: Record<string, number> = { total: tasks.length }
      tasks.forEach(t => { c[t.status] = (c[t.status] || 0) + 1 })
      counts[p.id] = c; tByP[p.id] = tasks
    }))
    setTaskCounts(counts); setProjectTasks(tByP); setLoading(false)
  }

  const sidebarProjects = projects.map(p => ({ id: p.id, name: p.name, color: p.color }))
  const totalOverdue = projects.reduce((a, p) => a + (taskCounts[p.id]?.overdue || 0), 0)
  const totalRisk    = projects.reduce((a, p) => a + (taskCounts[p.id]?.risk || 0), 0)
  const totalWip     = projects.reduce((a, p) => a + ((taskCounts[p.id]?.wip || 0) + (taskCounts[p.id]?.review || 0)), 0)
  const totalDone    = projects.reduce((a, p) => a + (taskCounts[p.id]?.done || 0), 0)



  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0e0e0c' }}>
      <Sidebar projects={sidebarProjects} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopNav
          breadcrumbs={[{ label: 'Home' }, { label: 'Master dashboard' }]}
          actions={
            <button onClick={() => setShowNewProject(true)} style={{ height: 28, padding: '0 14px', borderRadius: 7, background: '#0d2a45', color: '#85B7EB', border: '1px solid #1a4060', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              + New project
            </button>
          }
        />

        <div style={{ padding: 20, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ color: '#888780', padding: '40px 0', textAlign: 'center' }}>Loading...</div>
          ) : (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 20 }}>
                <StatCard label="Total overdue"   value={totalOverdue} sub="across all projects" color={totalOverdue > 0 ? 'red' : 'default'} />
                <StatCard label="At risk"         value={totalRisk}    sub="need attention"       color={totalRisk > 0 ? 'amber' : 'default'} />
                <StatCard label="In progress"     value={totalWip}     sub="active tasks"         color="blue" />
                <StatCard label="Done this cycle" value={totalDone}    sub="tasks completed"      color="green" />
              </div>

              {/* Tabs */}
              <div style={{ marginBottom: 20 }} />

              {/* ── CARDS VIEW ── */}
              {(
                <>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e6df', marginBottom: 2 }}>All projects</div>
                    <div style={{ fontSize: 11, color: '#888780' }}>{projects.length} production{projects.length !== 1 ? 's' : ''}</div>
                  </div>

                  {/* Project cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, marginBottom: 20 }}>
                    {projects.map(p => {
                      const c = taskCounts[p.id] || {}
                      const total = Math.max(c.total || 1, 1)
                      const done = c.done || 0; const pct = Math.round(done / total * 100)
                      const ov = c.overdue || 0; const rk = c.risk || 0
                      return (
                        <Link key={p.id} href={`/${p.id}`} style={{ textDecoration: 'none' }}>
                          <div style={{ background: '#161614', border: `1px solid ${ov > 0 ? '#3a1010' : '#222220'}`, borderRadius: 10, padding: 14, cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, marginTop: 4, flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e6df', lineHeight: 1.3 }}>{p.name}</div>
                                {p.code && <div style={{ fontSize: 10, color: '#888780', marginTop: 2 }}>{p.code}</div>}
                              </div>
                              <Badge status={p.status} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
                              {[{ v: ov, l: 'Overdue', c: ov > 0 ? '#F09595' : '#888780' }, { v: rk, l: 'At risk', c: rk > 0 ? '#FBCA75' : '#888780' }, { v: done, l: 'Done', c: '#97C459' }].map(({ v, l, c: col }) => (
                                <div key={l} style={{ background: '#111110', border: '1px solid #1e1e1c', borderRadius: 7, padding: '8px 6px', textAlign: 'center' }}>
                                  <div style={{ fontSize: 20, fontWeight: 700, color: col, lineHeight: 1, marginBottom: 3 }}>{v}</div>
                                  <div style={{ fontSize: 10, color: '#888780', fontWeight: 500 }}>{l}</div>
                                </div>
                              ))}
                            </div>
                            <ProgressBar pct={pct} color={p.color} height={4} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
                              <Link href={`/${p.id}/settings`} onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: '#888780', textDecoration: 'none', padding: '2px 6px', borderRadius: 4, border: '1px solid #2a2a27', background: '#111110' }}>⚙ Settings</Link>
                              <span style={{ fontSize: 10, color: '#888780', fontWeight: 500 }}>{pct}% complete</span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                    <div onClick={() => setShowNewProject(true)} style={{ background: '#111110', border: '1.5px dashed #2a2a27', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', minHeight: 180 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px dashed #3a3a37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#5F5E5A' }}>+</div>
                      <div style={{ fontSize: 11, color: '#5F5E5A', fontWeight: 600 }}>New project</div>
                    </div>
                  </div>

                  {/* Fix 3: Master timeline ABOVE cross-project comparison */}
                  <MasterTimeline projects={projects} projectTasks={projectTasks} taskCounts={taskCounts} />

                  {/* Cross-project table */}
                  {projects.length > 0 && (
                    <div style={{ background: '#161614', border: '1px solid #222220', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #222220' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#e8e6df' }}>Cross-project comparison</div>
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                          <thead>
                            <tr>{['Project','Progress','Overdue','At risk','Risk rating',''].map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '8px 14px', fontSize: 10, color: '#888780', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid #222220', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}</tr>
                          </thead>
                          <tbody>
                            {projects.map(p => {
                              const c = taskCounts[p.id] || {}
                              const total = Math.max(c.total || 1, 1)
                              const pct = Math.round((c.done || 0) / total * 100)
                              const ov = c.overdue || 0; const rk = c.risk || 0
                              const riskLabel = ov > 0 ? 'High' : rk > 0 ? 'Medium' : 'Low'
                              const riskColor = ov > 0 ? '#F09595' : rk > 0 ? '#FBCA75' : '#97C459'
                              const riskBg    = ov > 0 ? '#2a0a0a' : rk > 0 ? '#231a0a' : '#0a1a0a'
                              return (
                                <tr key={p.id} style={{ borderBottom: '1px solid #1a1a18' }}>
                                  <td style={{ padding: '10px 14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color }} />
                                      <span style={{ fontWeight: 700, color: '#e8e6df' }}>{p.name}</span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '10px 14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div style={{ width: 64, height: 5, background: '#1e1e1c', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: p.color, borderRadius: 3 }} />
                                      </div>
                                      <span style={{ color: '#888780', fontWeight: 600 }}>{pct}%</span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '10px 14px', color: ov > 0 ? '#F09595' : '#888780', fontWeight: ov > 0 ? 700 : 400 }}>{ov > 0 ? ov : '—'}</td>
                                  <td style={{ padding: '10px 14px', color: rk > 0 ? '#FBCA75' : '#888780', fontWeight: rk > 0 ? 700 : 400 }}>{rk > 0 ? rk : '—'}</td>
                                  <td style={{ padding: '10px 14px' }}>
                                    <span style={{ background: riskBg, color: riskColor, border: `1px solid ${riskColor}40`, fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 10 }}>{riskLabel}</span>
                                  </td>
                                  <td style={{ padding: '10px 14px' }}>
                                    <Link href={`/${p.id}`} style={{ fontSize: 11, color: '#85B7EB', fontWeight: 600, textDecoration: 'none' }}>Open →</Link>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

            </>
          )}
        </div>
      </div>

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreated={p => { setProjects(prev => [...prev, p]); setShowNewProject(false) }}
        />
      )}
    </div>
  )
}
