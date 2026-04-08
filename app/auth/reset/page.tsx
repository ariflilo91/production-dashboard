'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function ResetContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [ready, setReady]         = useState(false)

  useEffect(() => {
    // Supabase puts the session in the URL hash after clicking reset link
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    // Also check if session already set
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
    } else {
      await router.replace('/')
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', height: 42, padding: '0 14px', borderRadius: 9,
    border: '1px solid var(--border)', background: 'var(--bg-hover)',
    color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ width: '100%', maxWidth: 380, padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Set new password</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>Enter your new password below</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sub)', borderRadius: 14, padding: 24 }}>
          {!ready ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, padding: '20px 0' }}>
              Verifying reset link...
            </div>
          ) : (
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {error && (
                <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-bdr)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--red)' }}>
                  {error}
                </div>
              )}
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>New password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" style={inp} autoFocus />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Confirm password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="••••••••" style={inp} />
              </div>
              <button type="submit" disabled={loading} style={{ height: 44, borderRadius: 9, background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid var(--blue-bdr)', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'inherit', marginTop: 4 }}>
                {loading ? 'Saving...' : 'Set new password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading...</div>
      </div>
    }>
      <ResetContent />
    </Suspense>
  )
}
