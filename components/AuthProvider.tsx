'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase, getCurrentMember, TeamMember } from '@/lib/supabase'

type AuthCtxType = {
  member: TeamMember | null
  loading: boolean
  isAdmin: boolean
}

const AuthCtx = createContext<AuthCtxType>({ member: null, loading: true, isAdmin: false })

const PUBLIC_PATHS = ['/login', '/pending', '/auth/callback']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember]   = useState<TeamMember | null>(null)
  const [loading, setLoading] = useState(true)
  const router   = useRouter()
  const pathname = usePathname()

  async function loadMember() {
    try {
      // Try to restore session from cookies if set by callback
      const accessToken  = getCookie('sb-access-token')
      const refreshToken = getCookie('sb-refresh-token')

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (!error) {
          // Clear cookies after restoring — Supabase will manage its own storage
          deleteCookie('sb-access-token')
          deleteCookie('sb-refresh-token')
        }
      }

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        if (!PUBLIC_PATHS.includes(pathname)) router.replace('/login')
        setLoading(false)
        return
      }

      const m = await getCurrentMember()

      if (!m) {
        await supabase.auth.signOut()
        router.replace('/login')
        setLoading(false)
        return
      }

      setMember(m)

      if (m.status === 'pending') {
        if (pathname !== '/pending') router.replace('/pending')
      } else if (PUBLIC_PATHS.includes(pathname)) {
        router.replace('/')
      }
    } catch (err) {
      console.error('Auth init error:', err)
      if (!PUBLIC_PATHS.includes(pathname)) router.replace('/login')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadMember()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setMember(null)
        router.replace('/login')
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        const m = await getCurrentMember()
        if (!m) { router.replace('/login'); return }
        setMember(m)
        if (m.status === 'pending') router.replace('/pending')
        else if (PUBLIC_PATHS.includes(pathname)) router.replace('/')
      }
    })

    return () => subscription.unsubscribe()
  }, []) // only on mount

  if (loading && !PUBLIC_PATHS.includes(pathname)) return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading...</div>
    </div>
  )

  return (
    <AuthCtx.Provider value={{ member, loading, isAdmin: member?.role === 'admin' && member?.status === 'approved' }}>
      {children}
    </AuthCtx.Provider>
  )
}

// Cookie helpers
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; max-age=0`
}

export function useAuth() { return useContext(AuthCtx) }
