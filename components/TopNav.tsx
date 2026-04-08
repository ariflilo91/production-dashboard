'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeProvider'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

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
      setTime(new Intl.DateTimeFormat('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now))
      setDate(new Intl.DateTimeFormat('en-MY', { timeZone: 'Asia/Kuala_Lumpur', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(now))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', padding: '3px 10px', borderRadius: 7, background: 'var(--bg-base)', border: '1px solid var(--border-sub)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>{time}</div>
      <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: '.04em' }}>{date} · MYT</div>
    </div>
  )
}

export default function TopNav({ breadcrumbs, actions }: TopNavProps) {
  const { member, isAdmin } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  const initials = member?.display_name
    ? member.display_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)
    : (member?.email?.[0] ?? 'P').toUpperCase()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: '1px solid var(--border-sub)', background: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 20, minHeight: 52 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        {breadcrumbs.map((b, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span style={{ color: 'var(--border)', fontSize: 10 }}>/</span>}
            <span style={{ color: i === breadcrumbs.length - 1 ? 'var(--text-primary)' : 'var(--text-dim)', fontWeight: i === breadcrumbs.length - 1 ? 700 : 400 }}>
              {b.label}
            </span>
          </span>
        ))}
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <MYClock />
        <ThemeToggle />
        {actions}

        {/* User avatar + dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(s => !s)}
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--blue-bg)', border: '1px solid var(--blue-bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--blue)', cursor: 'pointer', overflow: 'hidden' }}
          >
            {member?.avatar_url
              ? <img src={member.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              : initials}
          </button>

          {showMenu && (
            <div style={{ position: 'absolute', top: '110%', right: 0, minWidth: 200, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,.2)', zIndex: 100, overflow: 'hidden' }}
              onMouseLeave={() => setShowMenu(false)}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-sub)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{member?.display_name || 'Team member'}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{member?.email}</div>
                {isAdmin && <div style={{ marginTop: 4, fontSize: 9, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Admin</div>}
              </div>
              <div style={{ padding: 6 }}>
                <Link href="/my-tasks" style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '8px 10px', borderRadius: 7, fontSize: 12, color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => setShowMenu(false)}>
                    My tasks
                  </div>
                </Link>
                {isAdmin && (
                  <Link href="/team" style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '8px 10px', borderRadius: 7, fontSize: 12, color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => setShowMenu(false)}>
                      Team management
                    </div>
                  </Link>
                )}
                <div style={{ borderTop: '1px solid var(--border-sub)', margin: '4px 0' }} />
                <button onClick={() => { supabase.auth.signOut(); setShowMenu(false) }} style={{ width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 12, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
