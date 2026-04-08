'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import TopNav from '@/components/TopNav'
import { StatCard, Badge } from '@/components/UI'
import { useAuth } from '@/components/AuthProvider'
import { getProjects, getMyTasks, updateTaskStatus, Project, Task } from '@/lib/supabase'
import { parseDate, formatDate, dayDiff, STATUS_LABELS } from '@/lib/utils'

const STATUS_ORDER = ['overdue','risk','wip','review','upcoming','done']

function urgencyColor(status: string) {
  const m: Record<string,string> = { overdue: 'var(--red)', risk: 'var(--amber)', wip: 'var(--blue)', review: 'var(--amber)', upcoming: 'var(--text-faint)', done: 'var(--green)' }
  return m[status] ?? 'var(--text-dim)'
}

export default function MyTasksPage() {
  const { member } = useAuth()
  const [projects, setProjects]  = useState<Project[]>([])
  const [tasks, setTasks]        = useState<Task[]>([])
  const [loading, setLoading]    = useState(true)
  const today = new Date()

  useEffect(() => {
    if (!member) return
    async function load() {
      const [projs, myTasks] = await Promise.all([getProjects(), getMyTasks(member!.id)])
      setProjects(projs); setTasks(myTasks); setLoading(false)
    }
    load()
  }, [member])

  const sidebarProjects = projects.map(p => ({ id: p.id, name: p.name, color: p.color }))

  const sorted = [...tasks].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
  const urgent   = sorted.filter(t => t.status === 'overdue' || t.status === 'risk')
  const thisWeek = sorted.filter(t => {
    const end = parseDate(t.end_date)
    const diff = dayDiff(today, end)
    return diff >= 0 && diff <= 7 && t.status !== 'done'
  })
  const active   = sorted.filter(t => t.status === 'wip' || t.status === 'review')
  const upcoming = sorted.filter(t => t.status === 'upcoming')
  const done     = sorted.filter(t => t.status === 'done')

  async function changeStatus(taskId: string, status: Task['status']) {
    await updateTaskStatus(taskId, status)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
  }

  const TaskRow = ({ task }: { task: Task }) => {
    const proj = projects.find(p => p.id === task.project_id) as any
    const daysLeft = dayDiff(today, parseDate(task.end_date))
    const isOverdue = daysLeft < 0
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--bg-card)', border: `1px solid ${task.status === 'overdue' ? 'var(--red-bdr)' : task.status === 'risk' ? 'var(--amber-bdr)' : 'var(--border-sub)'}`, marginBottom: 8 }}>
        {/* Project dot */}
        {proj && <div style={{ width: 8, height: 8, borderRadius: '50%', background: proj.color, flexShrink: 0 }} />}
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{task.department?.full_name}</span>
            <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>·</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{task.episode?.name}</span>
            <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>·</span>
            <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{task.stage_code}</span>
            {proj && <Link href={`/${proj.id}`} style={{ fontSize: 10, color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>{proj.name} →</Link>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: isOverdue ? 'var(--red)' : 'var(--text-dim)' }}>
              Due {formatDate(parseDate(task.end_date))}
              {isOverdue ? ` (${Math.abs(daysLeft)}d overdue)` : daysLeft <= 7 ? ` (${daysLeft}d left)` : ''}
            </span>
          </div>
        </div>
        {/* Status badge + update */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Badge status={task.status} />
          <select
            value={task.status}
            onChange={e => changeStatus(task.id, e.target.value as Task['status'])}
            style={{ height: 26, padding: '0 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 10, fontFamily: 'inherit', cursor: 'pointer' }}
          >
            {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
    )
  }

  const Section = ({ title, items, color }: { title: string; items: Task[]; color?: string }) => {
    if (!items.length) return null
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: color ?? 'var(--text-primary)' }}>{title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 10, padding: '1px 8px' }}>{items.length}</div>
        </div>
        {items.map(t => <TaskRow key={t.id} task={t} />)}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar projects={sidebarProjects} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopNav breadcrumbs={[{ label: 'My tasks' }]} />
        <div style={{ padding: 20, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ color: 'var(--text-dim)', padding: '40px 0', textAlign: 'center' }}>Loading your tasks...</div>
          ) : (
            <>
              {/* Welcome */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Welcome, {member?.display_name || member?.email?.split('@')[0]} 👋
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {tasks.length === 0 ? 'No tasks assigned to you yet.' : `You have ${tasks.filter(t => t.status !== 'done').length} active task${tasks.filter(t => t.status !== 'done').length !== 1 ? 's' : ''}.`}
                </div>
              </div>

              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8, marginBottom: 24 }}>
                <StatCard label="Urgent"      value={urgent.length}   sub="overdue or at risk"    color={urgent.length > 0 ? 'red' : 'default'} />
                <StatCard label="Due this week" value={thisWeek.length} sub="ending in 7 days"    color={thisWeek.length > 0 ? 'amber' : 'default'} />
                <StatCard label="In progress" value={active.length}   sub="active tasks"           color="blue" />
                <StatCard label="Done"        value={done.length}     sub="completed"              color="green" />
              </div>

              {tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-faint)', fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
                  No tasks assigned to you yet.<br />Your admin will assign tasks when ready.
                </div>
              ) : (
                <>
                  <Section title="🚨 Urgent — needs immediate attention" items={urgent} color="var(--red)" />
                  <Section title="📅 Due this week" items={thisWeek.filter(t => t.status !== 'overdue' && t.status !== 'risk')} color="var(--amber)" />
                  <Section title="⚡ In progress" items={active.filter(t => !thisWeek.includes(t))} color="var(--blue)" />
                  <Section title="🔜 Upcoming" items={upcoming} />
                  <Section title="✅ Done" items={done} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
