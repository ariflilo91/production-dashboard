'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function LoginContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [mode, setMode]         = useState<'login' | 'register'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [loading, setLoading]   = useState(false)
  const [checking, setChecking] = useState(true)
  const [message, setMessage]   = useState('')
  const [error, setError]       = useState('')

  const errorParam = params.get('error')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/')
      else setChecking(false)
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setMessage(''); setLoading(true)

    if (mode === 'register') {
      if (password !== confirmPw) {
        setError('Passwords do not match.'); setLoading(false); return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.'); setLoading(false); return
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      })

      if (signUpError) {
        setError(signUpError.message)
      } else {
        setMessage('Account created! Check your email to confirm, then wait for admin approval before signing in.')
      }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setError(signInError.message)
      } else if (data.session) {
        router.replace('/')
      }
    }

    setLoading(false)
  }

  if (checking) return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading...</div>
    </div>
  )

  const inp: React.CSSProperties = {
    width: '100%', height: 42, padding: '0 14px', borderRadius: 9,
    border: '1px solid var(--border)', background: 'var(--bg-hover)',
    color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit',
    outline: 'none',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ width: '100%', maxWidth: 380, padding: '0 20px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
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
            {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sub)', borderRadius: 14, padding: 24 }}>

          {/* Tab toggle */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-sub)', marginBottom: 20 }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setMessage('') }} style={{ flex: 1, padding: '8px 0', fontSize: 13, fontWeight: mode === m ? 700 : 400, color: mode === m ? 'var(--text-primary)' : 'var(--text-dim)', background: 'none', border: 'none', borderBottom: `2px solid ${mode === m ? 'var(--blue-mid)' : 'transparent'}`, cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1 }}>
                {m === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          {errorParam === 'auth_failed' && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-bdr)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--red)' }}>
              Authentication failed. Please try again.
            </div>
          )}

          {error && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-bdr)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--red)' }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-bdr)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--green)', lineHeight: 1.6 }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required style={inp} autoFocus
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6} style={inp}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Confirm password</label>
                <input
                  type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  placeholder="••••••••" required style={inp}
                />
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{ height: 44, borderRadius: 9, background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid var(--blue-bdr)', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'inherit', marginTop: 4 }}
            >
              {loading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {mode === 'register' && (
            <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-faint)', textAlign: 'center', lineHeight: 1.6 }}>
              After registering, an admin must approve your account before you can sign in.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
