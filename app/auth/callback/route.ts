import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  // Handle errors from Supabase
  if (error) {
    console.error('Auth error:', error, searchParams.get('error_description'))
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Exchange error:', exchangeError)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    // Success — AuthProvider will handle routing (pending vs approved)
    return NextResponse.redirect(`${origin}/`)
  }

  // No code and no error — something went wrong
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
