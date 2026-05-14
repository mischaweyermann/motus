import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/', request.url))

  const clientId = process.env.STRAVA_CLIENT_ID
  if (!clientId) return new NextResponse('STRAVA_CLIENT_ID nicht konfiguriert', { status: 500 })

  const origin = new URL(request.url).origin
  const redirectUri = `${origin}/api/strava/callback`

  const url = new URL('https://www.strava.com/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'activity:read_all')
  url.searchParams.set('approval_prompt', 'auto')

  return NextResponse.redirect(url.toString())
}
