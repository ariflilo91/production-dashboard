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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<TeamMember | null>(null)
  const [loading, setLoading] = useState(true)
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (pathname !== '/login') router.replace('/login')
        setLoading(false)
        return
      }
      const m = await getCurrentMember()
      if (!m && pathname !== '/login') {
        await supabase.auth.signOut()
        router.replace('/login')
      } else {
        setMember(m)
      }
      setLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setMember(null)
        router.replace('/login')
      } else if (event === 'SIGNED_IN' && session) {
        const m = await getCurrentMember()
        setMember(m)
      }
    })
    return () => subscription.unsubscribe()
  }, [pathname, router])

  if (loading && pathname !== '/login') return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading...</div>
    </div>
  )

  return (
    <AuthCtx.Provider value={{ member, loading, isAdmin: member?.role === 'admin' }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() { return useContext(AuthCtx) }
