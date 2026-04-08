'use client'
import { signOut } from '@/lib/supabase'

export default function PendingPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 20px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--amber-bg)', border: '1px solid var(--amber-bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>
          ⏳
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
          Awaiting approval
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 28 }}>
          Your account has been registered successfully.<br />
          Please wait for the admin to approve your access.<br /><br />
          Once approved, sign in again to access the dashboard.
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sub)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
          If you need urgent access, contact your production manager directly.
        </div>
        <button
          onClick={() => signOut()}
          style={{ height: 38, padding: '0 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-dim)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
