'use client'
import { useEffect, useState } from 'react'

interface TopNavProps {
  breadcrumbs: { label: string }[]
  actions?: React.ReactNode
}

function MYClock() {
  const [time, setTime] = useState('--:--:--')
  const [date, setDate] = useState('')

  useEffect(() => {
    function tick() {
      const now = new Date()
      setTime(new Intl.DateTimeFormat('en-MY', {
        timeZone: 'Asia/Kuala_Lumpur',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      }).format(now))
      setDate(new Intl.DateTimeFormat('en-MY', {
        timeZone: 'Asia/Kuala_Lumpur',
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      }).format(now))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      padding: '3px 10px', borderRadius: 7,
      background: '#0e0e0c', border: '1px solid #222220',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e6df', fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>
        {time}
      </div>
      <div style={{ fontSize: 9, color: '#888780', letterSpacing: '.04em' }}>
        {date} · MYT
      </div>
    </div>
  )
}

export default function TopNav({ breadcrumbs, actions }: TopNavProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 20px', borderBottom: '1px solid #222220',
      background: '#111110', position: 'sticky', top: 0, zIndex: 20, minHeight: 52,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        {breadcrumbs.map((b, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span style={{ color: '#333', fontSize: 10 }}>/</span>}
            <span style={{ color: i === breadcrumbs.length - 1 ? '#e8e6df' : '#888780', fontWeight: i === breadcrumbs.length - 1 ? 700 : 400 }}>
              {b.label}
            </span>
          </span>
        ))}
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <MYClock />
        {actions}
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: '#0d2a45', border: '1px solid #1a4060',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#85B7EB',
        }}>P</div>
      </div>
    </div>
  )
}
