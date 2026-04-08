'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'

function DoneContent() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    async function finish() {
      const at = params.get('at')
      const rt = params.get('rt')

      if (at && rt) {
        const { error } = await supabase.auth.setSession({
          access_token: at,
          refresh_token: rt,
        })
        if (error) {
          console.error('setSession error:', error)
          router.replace('/login?error=auth_failed')
          return
        }
      }
      // AuthProvider will take over routing from here
      router.replace('/')
    }
    finish()
  }, [params, router])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Signing you in...</div>
    </div>
  )
}

export default function AuthDonePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Signing you in...</div>
      </div>
    }>
      <DoneContent />
    </Suspense>
  )
}
