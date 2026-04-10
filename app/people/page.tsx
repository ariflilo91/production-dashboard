'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import TopNav from '@/components/TopNav'
import {
  getProjects, getTasksForMember, getHolidays,
  Project, Task, Holiday, TeamMember
} from '@/lib/supabase'
import {
  buildDays, buildWeekHeaders, buildMonthHeaders, workDayIndex, dayDiff,
  parseDate, formatDate, isOffDay, STATUS_LABELS
} from '@/lib/utils'

const COL_W = 28

export default function PeoplePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [projs, hols] = await Promise.all([
        getProjects(),
        getHolidays('all'), // Adjust based on your Supabase logic
      ])
      setProjects(projs)
      setHolidays(hols)
      // Assuming you have a function to fetch team members
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-10">Loading...</div>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar projects={projects.map(p => ({ id: p.id, name: p.name, color: p.color }))} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopNav breadcrumbs={[{ label: 'People' }]} />
        <div style={{ padding: 20 }}>
          {members.map(m => (
            <PersonGantt key={m.id} member={m} holidays={holidays} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PersonGantt({ member, holidays }: { member: TeamMember; holidays: Holiday[] }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  
  const viewStart = new Date()
  viewStart.setDate(viewStart.getDate() - 14)
  const viewEnd = new Date()
  viewEnd.setMonth(viewEnd.getMonth() + 3)

  const days = buildDays(viewStart, viewEnd)
  const today = new Date()
  // FIX: workDayIndex is now correctly imported
  const todayI = workDayIndex(days, today)

  useEffect(() => {
    getTasksForMember(member.id).then(t => {
      setTasks(t)
      setLoading(false)
    })
  }, [member.id])

  // FIX: buildMonthHeaders and buildWeekHeaders are imported
  const months = buildMonthHeaders(days)
  // FIX: Removed extra parenthesis that caused the syntax error
  const weeks  = buildWeekHeaders(days)

  const ov = tasks.filter(t => t.status === 'overdue').length
  const rk = tasks.filter(t => t.status === 'risk').length

  return (
    <div style={{ marginBottom: 30, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{member.name}</span>
          <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-dim)' }}>{member.role}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {ov > 0 && <span style={{ color: 'var(--red)', fontSize: 11, fontWeight: 600 }}>{ov} Overdue</span>}
          {rk > 0 && <span style={{ color: 'var(--amber)', fontSize: 11, fontWeight: 600 }}>{rk} At Risk</span>}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
              {months.map((m, i) => (
                <th key={i} colSpan={m.count} style={{ fontSize: 10, color: 'var(--text-dim)', padding: '4px 0', textAlign: 'center', borderRight: '1px solid var(--border-dim)' }}>
                  {m.label}
                </th>
              ))}
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
              {days.map((d, i) => {
                const off = isOffDay(d, holidays)
                const isToday = i === todayI
                return (
                  <th key={i} style={{
                    minWidth: COL_W, fontSize: 9, padding: '4px 0',
                    background: isToday ? 'var(--blue-bg)' : off.off ? 'var(--bg-surface)' : 'transparent',
                    color: isToday ? 'var(--blue)' : 'var(--text-faint)'
                  }}>
                    {d.getDate()}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              {days.map((d, i) => {
                const off = isOffDay(d, holidays)
                const isToday = i === todayI
                
                // Simple logic to find if a task exists on this day
                const taskOnDay = tasks.find(t => {
                  const s = workDayIndex(days, parseDate(t.start_date))
                  const e = workDayIndex(days, parseDate(t.end_date))
                  return i >= s && i <= e
                })

                return (
                  <td key={i} style={{
                    height: 40, borderRight: '1px solid var(--border-dim)', position: 'relative',
                    background: off.off ? 'var(--bg-surface)' : 'transparent'
                  }}>
                    {isToday && <div style={{ position: 'absolute', inset: '0 auto', width: 2, background: 'var(--blue)', left: '50%', transform: 'translateX(-50%)', zIndex: 2 }} />}
                    {taskOnDay && (
                      <div style={{
                        position: 'absolute', inset: '8px 2px', borderRadius: 4,
                        background: 'var(--blue-mid)', opacity: 0.8
                      }} />
                    )}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
