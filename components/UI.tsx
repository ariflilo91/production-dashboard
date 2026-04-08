import { STATUS_LABELS } from '@/lib/utils'

export function StatCard({ label, value, sub, color = 'default' }: { label: string; value: number | string; sub?: string; color?: string }) {
  const cols: Record<string, string> = { red: 'var(--red)', amber: 'var(--amber)', blue: 'var(--blue)', green: 'var(--green)', default: 'var(--text-primary)' }
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sub)', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, marginBottom: 4, color: cols[color] ?? cols.default }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{sub}</div>}
    </div>
  )
}

const badgeStyles: Record<string, React.CSSProperties> = {
  done:      { background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-bdr)' },
  wip:       { background: 'var(--blue-bg)',  color: 'var(--blue)',  border: '1px solid var(--blue-bdr)'  },
  review:    { background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid var(--amber-bdr)' },
  overdue:   { background: 'var(--red-bg)',   color: 'var(--red)',   border: '1px solid var(--red-bdr)'   },
  risk:      { background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid var(--red)'       },
  upcoming:  { background: 'var(--bg-hover)', color: 'var(--text-dim)', border: '1px solid var(--border)' },
  Active:    { background: 'var(--blue-bg)',  color: 'var(--blue)',  border: '1px solid var(--blue-bdr)'  },
  Planning:  { background: 'var(--bg-hover)', color: 'var(--text-dim)', border: '1px solid var(--border)' },
  'On hold': { background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid var(--amber-bdr)' },
  Completed: { background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-bdr)' },
}

export function Badge({ status }: { status: string }) {
  const s = badgeStyles[status] ?? { background: 'var(--bg-hover)', color: 'var(--text-dim)', border: '1px solid var(--border)' }
  return <span style={{ ...s, fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>{STATUS_LABELS[status] ?? status}</span>
}

export function ProgressBar({ pct, color = 'var(--blue-mid)', height = 4 }: { pct: number; color?: string; height?: number }) {
  return (
    <div style={{ height, background: 'var(--border-sub)', borderRadius: height / 2, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, Math.max(0, Math.round(pct)))}%`, height: '100%', background: color, borderRadius: height / 2 }} />
    </div>
  )
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sub)', borderRadius: 10, padding: '14px 16px', ...style }}>{children}</div>
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>{children}</div>
}
