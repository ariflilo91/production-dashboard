import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError || !data.session) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    const { access_token, refresh_token } = data.session
    const response = NextResponse.redirect(`${origin}/`)

    // Write tokens as cookies so client-side Supabase can restore the session
    response.cookies.set('sb-access-token',  access_token,  { path: '/', httpOnly: false, sameSite: 'lax', secure: true, maxAge: 3600 })
    response.cookies.set('sb-refresh-token', refresh_token, { path: '/', httpOnly: false, sameSite: 'lax', secure: true, maxAge: 86400 * 7 })

    return response
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
