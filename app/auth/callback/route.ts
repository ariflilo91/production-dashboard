import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    console.error('OAuth error:', error, searchParams.get('error_description'))
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  if (code) {
    try {
      const { createClient } = require('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            flowType: 'pkce',
            persistSession: false,
          }
        }
      )

      const { data, error: err } = await supabase.auth.exchangeCodeForSession(code)

      if (err || !data?.session) {
        console.error('Exchange failed:', err?.message)
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
      }

      // Pass tokens to client via URL fragment — client will pick them up
      const { access_token, refresh_token } = data.session
      const redirectUrl = new URL(`${origin}/auth/done`)
      redirectUrl.searchParams.set('at', access_token)
      redirectUrl.searchParams.set('rt', refresh_token)
      return NextResponse.redirect(redirectUrl.toString())

    } catch (e) {
      console.error('Callback exception:', e)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
