'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  projects?: { id: string; name: string; color: string }[]
  activeProjectId?: string
}

function NavItem({ href, label, active, dot, color }: {
  href: string; label: string; active: boolean; dot?: boolean; color?: string
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 8px', borderRadius: 7, fontSize: 12,
        fontWeight: 500, cursor: 'pointer', marginBottom: 1,
        background: active ? '#0d2a45' : 'transparent',
        color: active ? '#85B7EB' : '#a8a6a0',
      }}>
        {dot && color && (
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
        )}
        {!dot && (
          <div style={{ width: 7, height: 7, borderRadius: 2, background: active ? '#85B7EB' : '#444441', flexShrink: 0 }} />
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      </div>
    </Link>
  )
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: 9, color: '#5F5E5A', textTransform: 'uppercase',
      letterSpacing: '.09em', fontWeight: 700,
      padding: '0 8px', marginBottom: 5, marginTop: 4,
    }}>{text}</div>
  )
}

export default function Sidebar({ projects = [], activeProjectId }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div style={{
      width: 220, minWidth: 220,
      background: '#111110',
      borderRight: '1px solid #222220',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
      overflowY: 'auto',
    }}>
      {/* App name */}
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid #222220' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: '#0d2a45', border: '1px solid #1a4060',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 10,
        }}>
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1.5" fill="#85B7EB" />
            <rect x="8" y="1" width="5" height="5" rx="1.5" fill="#378ADD" opacity=".6" />
            <rect x="1" y="8" width="5" height="5" rx="1.5" fill="#378ADD" opacity=".4" />
            <rect x="8" y="8" width="5" height="5" rx="1.5" fill="#85B7EB" opacity=".3" />
          </svg>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#e8e6df', lineHeight: 1.4 }}>
          Durioo In-house<br />Production
        </div>
        <div style={{ fontSize: 10, color: '#888780', marginTop: 2 }}>Studio dashboard</div>
      </div>

      {/* Overview */}
      <div style={{ padding: '10px 8px 0' }}>
        <SectionLabel text="Overview" />
        <NavItem href="/" label="Master dashboard" active={pathname === '/'} />
      </div>

      {/* Projects */}
      <div style={{ padding: '6px 8px', flex: 1 }}>
        <SectionLabel text="Projects" />
        {projects.map(p => (
          <NavItem
            key={p.id}
            href={`/${p.id}`}
            label={p.name}
            active={activeProjectId === p.id}
            dot
            color={p.color}
          />
        ))}
      </div>

      {/* Current project sub-nav */}
      {activeProjectId && (
        <div style={{ padding: '0 8px 6px', borderTop: '1px solid #1e1e1c' }}>
          <SectionLabel text="Current project" />
          <NavItem href={`/${activeProjectId}`}         label="Timeline" active={pathname === `/${activeProjectId}`} />
          <NavItem href={`/${activeProjectId}/metrics`} label="Metrics"  active={pathname.includes('/metrics')} />
        </div>
      )}

      {/* New project */}
      <div style={{ padding: 8, borderTop: '1px solid #222220' }}>
        <Link href="/new-project" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, padding: '7px 8px', borderRadius: 7,
            border: '1.5px dashed #2a2a27', cursor: 'pointer',
            color: '#888780', fontSize: 11, fontWeight: 600,
          }}>
            <span style={{ fontSize: 15, lineHeight: 1, color: '#5F5E5A' }}>+</span>
            New project
          </div>
        </Link>
      </div>
    </div>
  )
}
