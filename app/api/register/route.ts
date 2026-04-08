import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side route uses service role key — bypasses RLS
export async function POST(request: NextRequest) {
  try {
    const { user_id, email } = await request.json()

    if (!user_id || !email) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Service role client — can write to any table
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Count existing members to decide role
    const { count } = await supabaseAdmin
      .from('team_members')
      .select('*', { count: 'exact', head: true })

    const isFirst    = (count ?? 0) === 0
    const displayName = email.split('@')[0]

    const { error } = await supabaseAdmin.from('team_members').upsert({
      user_id,
      email,
      display_name: displayName,
      role:   isFirst ? 'admin'    : 'member',
      status: isFirst ? 'approved' : 'pending',
    }, { onConflict: 'email' })

    if (error) {
      console.error('team_members upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, isFirst })
  } catch (err) {
    console.error('Register API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
