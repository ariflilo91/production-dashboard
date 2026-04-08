'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithGoogle, supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router   = useRouter()
  const params   = useSearchParams()
  const [loading, setLoading]   = useState(false)
  const [checking, setChecking] = useState(true)
  const error = params.get('error')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/')
      else setChecking(false)
    })
  }, [router])

  async function handleGoogleLogin() {
    setLoading(true)
    try { await signInWithGoogle() }
    catch { setLoading(false) }
  }

  if (checking) return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ width: '100%', maxWidth: 380, padding: '0 20px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--blue-bg)', border: '1px solid var(--blue-bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="28" height="28" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1.5" fill="var(--blue)" />
              <rect x="8" y="1" width="5" height="5" rx="1.5" fill="var(--blue-mid)" opacity=".6" />
              <rect x="1" y="8" width="5" height="5" rx="1.5" fill="var(--blue-mid)" opacity=".4" />
              <rect x="8" y="8" width="5" height="5" rx="1.5" fill="var(--blue)" opacity=".3" />
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Durioo In-house Production
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            Sign in to access your studio dashboard
          </div>
        </div>

        {error === 'auth_failed' && (
          <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-bdr)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--red)', textAlign: 'center' }}>
            Sign in failed. Please try again.
          </div>
        )}

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sub)', borderRadius: 14, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 24, lineHeight: 1.6 }}>
            Sign in with your Google account.<br />
            New users require admin approval before accessing the dashboard.
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%', height: 46, borderRadius: 10,
              background: loading ? 'var(--bg-hover)' : 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'all 0.15s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" fill="#4285F4"/>
              <path d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" fill="#34A853"/>
              <path d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z" fill="#FBBC05"/>
              <path d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" fill="#EA4335"/>
            </svg>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>
        </div>
      </div>
    </div>
  )
}
