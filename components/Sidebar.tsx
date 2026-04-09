'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  projects?: { id: string; name: string; color: string }[]
  activeProjectId?: string
}

const LOGO_URL = 'https://m.media-amazon.com/images/I/21p8m8de0OL.png'

function NavItem({ href, label, active, dot, color }: { href: string; label: string; active: boolean; dot?: boolean; color?: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', marginBottom: 1, background: active ? 'var(--blue-bg)' : 'transparent', color: active ? 'var(--blue)' : 'var(--text-muted)', transition: 'all 0.12s' }}>
        {dot && color
          ? <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
          : <div style={{ width: 7, height: 7, borderRadius: 2, background: active ? 'var(--blue)' : 'var(--text-faint)', flexShrink: 0 }} />
        }
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      </div>
    </Link>
  )
}

function SectionLabel({ text }: { text: string }) {
  return <div style={{ fontSize: 9, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.09em', fontWeight: 700, padding: '0 8px', marginBottom: 5, marginTop: 4 }}>{text}</div>
}

export default function Sidebar({ projects = [], activeProjectId }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div style={{ width: 220, minWidth: 220, background: 'var(--bg-surface)', borderRight: '1px solid var(--border-sub)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, overflowY: 'auto' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-sub)' }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--blue-bg)', border: '1px solid var(--blue-bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, overflow: 'hidden' }}>
          <img src={LOGO_URL} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>Durioo In-house<br />Production</div>
        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>Studio dashboard</div>
      </div>

      <div style={{ padding: '10px 8px 0' }}>
        <SectionLabel text="Overview" />
        <NavItem href="/" label="Master dashboard" active={pathname === '/'} />
        <NavItem href="/people" label="People" active={pathname.startsWith('/people')} />
        <NavItem href="/notes" label="Notes & memos" active={pathname === '/notes'} />
      </div>

      <div style={{ padding: '6px 8px', flex: 1 }}>
        <SectionLabel text="Projects" />
        {projects.map(p => (
          <NavItem key={p.id} href={`/${p.id}`} label={p.name} active={activeProjectId === p.id} dot color={p.color} />
        ))}
      </div>

      {activeProjectId && (
        <div style={{ padding: '0 8px 6px', borderTop: '1px solid var(--border-dim)' }}>
          <SectionLabel text="Current project" />
          <NavItem href={`/${activeProjectId}`}          label="Timeline" active={pathname === `/${activeProjectId}`} />
          <NavItem href={`/${activeProjectId}/metrics`}  label="Metrics"  active={pathname.includes('/metrics')} />
          <NavItem href={`/${activeProjectId}/settings`} label="Settings" active={pathname.includes('/settings')} />
        </div>
      )}

      <div style={{ padding: 8, borderTop: '1px solid var(--border-sub)' }}>
        <Link href="/new-project" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 8px', borderRadius: 7, border: '1.5px dashed var(--border)', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 11, fontWeight: 600 }}>
            <span style={{ fontSize: 15, lineHeight: 1, color: 'var(--text-faint)' }}>+</span>
            New project
          </div>
        </Link>
      </div>
    </div>
  )
}
