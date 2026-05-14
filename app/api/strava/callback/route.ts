import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/profile?error=strava_denied', request.url))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/', request.url))

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    return NextResponse.redirect(new URL('/profile?error=strava_token', request.url))
  }

  const tokens = await res.json()

  await supabase.from('integrations').upsert({
    user_id: user.id,
    provider: 'strava',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
    provider_user_id: String(tokens.athlete?.id ?? ''),
    connected_at: new Date().toISOString(),
  }, { onConflict: 'user_id,provider' })

  return NextResponse.redirect(new URL('/profile?connected=strava', request.url))
}
