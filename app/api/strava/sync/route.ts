import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TYPE_MAP: Record<string, string> = {
  Run: 'Run', TrailRun: 'Run', Treadmill: 'Run', VirtualRun: 'Run',
  Ride: 'Cycle', EBikeRide: 'Cycle', VirtualRide: 'Cycle', GravelRide: 'Cycle',
  WeightTraining: 'Gym', Workout: 'Gym', CrossFit: 'Gym', Elliptical: 'Gym',
  Tennis: 'Tennis', Squash: 'Tennis', Badminton: 'Tennis', Pickleball: 'Tennis',
}

async function getValidToken(integration: Record<string, string>, supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string> {
  const expiresAt = new Date(integration.token_expires_at).getTime()
  if (expiresAt > Date.now() + 60_000) return integration.access_token

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: integration.refresh_token,
    }),
  })
  if (!res.ok) throw new Error('Token refresh failed')
  const tokens = await res.json()

  await supabase.from('integrations').update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
  }).eq('user_id', userId).eq('provider', 'strava')

  return tokens.access_token
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: integration } = await supabase
    .from('integrations')
    .select('access_token, refresh_token, token_expires_at')
    .eq('user_id', user.id)
    .eq('provider', 'strava')
    .single()

  if (!integration) return NextResponse.json({ error: 'Strava nicht verbunden' }, { status: 400 })

  let token: string
  try {
    token = await getValidToken(integration, supabase, user.id)
  } catch {
    return NextResponse.json({ error: 'Token-Erneuerung fehlgeschlagen' }, { status: 401 })
  }

  const res = await fetch(
    'https://www.strava.com/api/v3/athlete/activities?per_page=50',
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return NextResponse.json({ error: 'Strava API Fehler' }, { status: 502 })

  const activities = await res.json()

  // Get already-imported external IDs to avoid duplicates
  const { data: existing } = await supabase
    .from('workout_sessions')
    .select('external_id')
    .eq('user_id', user.id)
    .eq('source', 'strava')

  const existingIds = new Set((existing ?? []).map((r: { external_id: string }) => r.external_id))

  type StravaActivity = {
    id: number; name: string; sport_type?: string; type?: string
    moving_time?: number; elapsed_time?: number
    calories?: number; kilojoules?: number; start_date: string
  }

  const newActivities: StravaActivity[] = activities.filter(
    (a: StravaActivity) => !existingIds.has(String(a.id))
  )

  async function resolveKcal(a: StravaActivity): Promise<number | null> {
    // List endpoint already has calories for some activity types
    if (a.calories && a.calories > 0) return Math.round(a.calories)

    // Fetch detail endpoint for accurate calories
    try {
      const detailRes = await fetch(
        `https://www.strava.com/api/v3/activities/${a.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (detailRes.ok) {
        const detail = await detailRes.json()
        if (detail.calories && detail.calories > 0) return Math.round(detail.calories)
        // Strava kilojoules (cycling power) ≈ kcal due to efficiency/unit factors
        if (detail.kilojoules && detail.kilojoules > 0) return Math.round(detail.kilojoules)
      }
    } catch { /* ignore, save without kcal */ }

    return null
  }

  // Fetch details sequentially to stay within Strava rate limits
  const newRows = []
  for (const a of newActivities) {
    newRows.push({
      user_id: user.id,
      name: a.name,
      type: TYPE_MAP[a.sport_type ?? a.type ?? ''] ?? 'Sonstiges',
      duration: Math.round((a.moving_time ?? a.elapsed_time ?? 0) / 60),
      kcal: await resolveKcal(a),
      source: 'strava',
      external_id: String(a.id),
      completed_at: a.start_date,
    })
  }

  if (newRows.length > 0) {
    await supabase.from('workout_sessions').insert(newRows)
  }

  return NextResponse.json({ imported: newRows.length })
}
