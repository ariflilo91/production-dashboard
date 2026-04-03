import { STATUS_LABELS } from '@/lib/utils'

const statColors: Record<string, string> = {
  red: '#F09595', amber: '#FBCA75', blue: '#85B7EB', green: '#97C459', default: '#e8e6df',
}

export function StatCard({ label, value, sub, color = 'default' }: {
  label: string; value: number | string; sub?: string; color?: string
}) {
  return (
    <div style={{ background: '#161614', border: '1px solid #222220', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, color: '#888780', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, marginBottom: 4, color: statColors[color] ?? statColors.default }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#5F5E5A' }}>{sub}</div>}
    </div>
  )
}

const badgeStyles: Record<string, { background: string; color: string; border: string }> = {
  done:      { background: '#0a1e0a', color: '#97C459', border: '1px solid #183018' },
  wip:       { background: '#071828', color: '#85B7EB', border: '1px solid #0d2a48' },
  review:    { background: '#1e1408', color: '#FBCA75', border: '1px solid #3a2808' },
  overdue:   { background: '#1e0808', color: '#F09595', border: '1px solid #3a1010' },
  risk:      { background: '#1e1408', color: '#FBCA75', border: '1px solid #F09595' },
  upcoming:  { background: '#161614', color: '#888780', border: '1px solid #2a2a27' },
  Active:    { background: '#0d2235', color: '#85B7EB', border: '1px solid #1a3a5a' },
  Planning:  { background: '#1e1e1c', color: '#888780', border: '1px solid #2a2a27' },
  'On hold': { background: '#231a0a', color: '#FBCA75', border: '1px solid #3a2a0a' },
  Completed: { background: '#0a1e0a', color: '#97C459', border: '1px solid #183018' },
}

export function Badge({ status }: { status: string }) {
  const s = badgeStyles[status] ?? { background: '#1a1a18', color: '#888780', border: '1px solid #2a2a27' }
  return (
    <span style={{ ...s, fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

export function ProgressBar({ pct, color = '#378ADD', height = 4 }: { pct: number; color?: string; height?: number }) {
  return (
    <div style={{ height, background: '#1e1e1c', borderRadius: height / 2, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, Math.max(0, Math.round(pct)))}%`, height: '100%', background: color, borderRadius: height / 2 }} />
    </div>
  )
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#161614', border: '1px solid #222220', borderRadius: 10, padding: '14px 16px', ...style }}>
      {children}
    </div>
  )
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: '#888780', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
      {children}
    </div>
  )
}
