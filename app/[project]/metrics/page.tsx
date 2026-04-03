'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import TopNav from '@/components/TopNav'
import { StatCard, Card, CardTitle, ProgressBar } from '@/components/UI'
import { supabase, getProjects, getEpisodes, getDepartments, getTasks, getHolidays, Project, Episode, Department, Task, Holiday } from '@/lib/supabase'
import { parseDate, formatDate, dayDiff, workdaysRemaining, STATUS_LABELS } from '@/lib/utils'

export default function MetricsPage({ params }: { params: { project: string } }) {
  const projectId = params.project
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [project, setProject]         = useState<Project | null>(null)
  const [episodes, setEpisodes]       = useState<Episode[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [tasks, setTasks]             = useState<Task[]>([])
  const [holidays, setHolidays]       = useState<Holiday[]>([])
  const [loading, setLoading]         = useState(true)
  const today = new Date()

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

  if (loading || !project) return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0e0e0c', color: '#888780' }}>Loading...</div>
  )

  const sortedDepts = [...departments].sort((a, b) => a.sort_order - b.sort_order)
  const totalDepts  = sortedDepts.length
  const ov = tasks.filter(t => t.status === 'overdue').length
  const rk = tasks.filter(t => t.status === 'risk').length
  const wp = tasks.filter(t => t.status === 'wip' || t.status === 'review').length
  const dn = tasks.filter(t => t.status === 'done').length
  const sidebarProjects = allProjects.map(p => ({ id: p.id, name: p.name, color: p.color }))

  const dhColors: Record<string, string> = { done: '#97C459', wip: '#85B7EB', review: '#FBCA75', overdue: '#F09595', risk: '#F09595', upcoming: '#333332' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0e0e0c' }}>
      <Sidebar projects={sidebarProjects} activeProjectId={projectId} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopNav breadcrumbs={[{ label: project.name }, { label: 'Metrics' }]} />
        <div style={{ padding: 20, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 20 }}>
            <StatCard label="Overdue"     value={ov} sub="tasks past due"         color={ov > 0 ? 'red' : 'default'} />
            <StatCard label="At risk"     value={rk} sub="need attention"         color={rk > 0 ? 'amber' : 'default'} />
            <StatCard label="In progress" value={wp} sub="active now"             color="blue" />
            <StatCard label="Done"        value={dn} sub={`of ${totalDepts} depts`} color="green" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>

            <Card>
              <CardTitle>Department health</CardTitle>
              {sortedDepts.map(dept => {
                const t = tasks.find(t => t.department_id === dept.id)
                const col = t ? (dhColors[t.status] ?? '#555552') : '#252523'
                const fillPct = !t ? 0 : t.status === 'done' ? 100 : (t.status === 'wip' || t.status === 'review') ? 60 : (t.status === 'overdue' || t.status === 'risk') ? 100 : 0
                return (
                  <div key={dept.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #1a1a18' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#c8c6bf', width: 100, flexShrink: 0 }}>{dept.full_name}</div>
                    <div style={{ flex: 1, height: 6, background: '#1a1a18', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${fillPct}%`, height: '100%', background: col, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: col, width: 72, textAlign: 'right' }}>
                      {t ? STATUS_LABELS[t.status] : 'No data'}
                    </div>
                  </div>
                )
              })}
            </Card>

            <Card>
              <CardTitle>Episode completion</CardTitle>
              {episodes.map(ep => {
                const epDone = tasks.filter(t => t.episode_id === ep.id && t.status === 'done').length
                const pct    = totalDepts > 0 ? Math.round(epDone / totalDepts * 100) : 0
                return (
                  <div key={ep.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#e8e6df' }}>{ep.name}</span>
                      <span style={{ fontSize: 11, color: '#888780', fontWeight: 600 }}>{epDone}/{totalDepts} depts · {pct}%</span>
                    </div>
                    <ProgressBar pct={pct} color={project.color} height={6} />
                  </div>
                )
              })}
            </Card>

            <Card>
              <CardTitle>Overdue age tracker</CardTitle>
              {tasks.filter(t => t.status === 'overdue').length === 0 ? (
                <div style={{ fontSize: 12, color: '#97C459', padding: '8px 0', fontWeight: 600 }}>No overdue tasks!</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr>{['Department', 'Stage', 'Days overdue'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '4px 6px', fontSize: 10, color: '#888780', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid #222220' }}>{h}</th>
                  ))}</tr></thead>
                  <tbody>
                    {tasks.filter(t => t.status === 'overdue').map(t => {
                      const dept = departments.find(d => d.id === t.department_id)
                      const days = dayDiff(parseDate(t.end_date), today)
                      const cls  = days > 14 ? { background: '#2a0808', color: '#F09595' } : days > 7 ? { background: '#231a0a', color: '#FBCA75' } : { background: '#0a1e0a', color: '#97C459' }
                      return (
                        <tr key={t.id}>
                          <td style={{ padding: '8px 6px', borderBottom: '1px solid #1a1a18', fontWeight: 700, color: '#c8c6bf' }}>{dept?.full_name}</td>
                          <td style={{ padding: '8px 6px', borderBottom: '1px solid #1a1a18', color: '#888780' }}>{t.stage_code}</td>
                          <td style={{ padding: '8px 6px', borderBottom: '1px solid #1a1a18' }}>
                            <span style={{ ...cls, fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 10 }}>{days} days</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </Card>

            <Card>
              <CardTitle>Working days remaining</CardTitle>
              {tasks.filter(t => t.status !== 'done' && t.status !== 'upcoming').length === 0 ? (
                <div style={{ fontSize: 12, color: '#888780', padding: '8px 0' }}>No active tasks.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr>{['Department', 'Due date', 'Days left'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '4px 6px', fontSize: 10, color: '#888780', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid #222220' }}>{h}</th>
                  ))}</tr></thead>
                  <tbody>
                    {tasks.filter(t => t.status !== 'done' && t.status !== 'upcoming').map(t => {
                      const dept = departments.find(d => d.id === t.department_id)
                      const wd   = workdaysRemaining(parseDate(t.end_date), today, holidays)
                      const cls  = wd.late || wd.val <= 3 ? { background: '#2a0808', color: '#F09595' } : wd.val <= 7 ? { background: '#231a0a', color: '#FBCA75' } : { background: '#0a1e0a', color: '#97C459' }
                      return (
                        <tr key={t.id}>
                          <td style={{ padding: '8px 6px', borderBottom: '1px solid #1a1a18', fontWeight: 700, color: '#c8c6bf' }}>{dept?.full_name}</td>
                          <td style={{ padding: '8px 6px', borderBottom: '1px solid #1a1a18', color: '#888780' }}>{formatDate(parseDate(t.end_date))}</td>
                          <td style={{ padding: '8px 6px', borderBottom: '1px solid #1a1a18' }}>
                            <span style={{ ...cls, fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 10 }}>{wd.late ? `${wd.val}d overdue` : `${wd.val} days`}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </Card>

            <Card>
              <CardTitle>Bottleneck detector</CardTitle>
              {(() => {
                const risks = sortedDepts.map(d => {
                  const t = tasks.find(t => t.department_id === d.id)
                  const score = !t ? 0 : t.status === 'overdue' ? 3 : t.status === 'risk' ? 2 : (t.status === 'wip' || t.status === 'review') ? 1 : 0
                  return { dept: d, score }
                }).filter(r => r.score > 0).sort((a, b) => b.score - a.score)

                if (!risks.length) return <div style={{ fontSize: 12, color: '#97C459', padding: '8px 0', fontWeight: 600 }}>No bottlenecks detected.</div>

                return risks.map((r, i) => {
                  const col = r.score >= 3 ? '#F09595' : r.score >= 2 ? '#FBCA75' : '#85B7EB'
                  const lbl2 = r.score >= 3 ? 'Critical' : r.score >= 2 ? 'At risk' : 'Watch'
                  return (
                    <div key={r.dept.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #1a1a18' }}>
                      <span style={{ fontSize: 11, color: '#5F5E5A', fontWeight: 700, width: 18 }}>{i + 1}</span>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#c8c6bf' }}>{r.dept.full_name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 10, background: col + '20', color: col, border: `1px solid ${col}40` }}>{lbl2}</span>
                    </div>
                  )
                })
              })()}
            </Card>

            <Card>
              <CardTitle>Delivery forecast</CardTitle>
              {episodes.map(ep => {
                const epTasks = tasks.filter(t => t.episode_id === ep.id && t.status !== 'done')
                const latest  = epTasks.length ? new Date(Math.max(...epTasks.map(t => parseDate(t.end_date).getTime()))) : null
                const hasRisk = epTasks.some(t => t.status === 'overdue' || t.status === 'risk')
                return (
                  <div key={ep.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid #1a1a18' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#e8e6df', width: 50 }}>{ep.name}</span>
                    <span style={{ fontSize: 11, color: '#888780', flex: 1 }}>{latest ? `Est. ${formatDate(latest)}` : 'All complete'}</span>
                    <span style={{ background: hasRisk ? '#231a0a' : '#0a1e0a', color: hasRisk ? '#FBCA75' : '#97C459', border: `1px solid ${hasRisk ? '#3a2808' : '#183018'}`, fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 10 }}>
                      {hasRisk ? 'At risk' : 'On track'}
                    </span>
                  </div>
                )
              })}
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}
