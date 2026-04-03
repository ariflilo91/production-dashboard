'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProjectRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/') }, [router])
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0e0e0c', color: '#888780' }}>
      Redirecting...
    </div>
  )
}
