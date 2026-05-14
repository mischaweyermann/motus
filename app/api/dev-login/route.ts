import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  const email = process.env.DEV_EMAIL
  const password = process.env.DEV_PASSWORD

  if (!email || !password) {
    return new NextResponse(
      'DEV_EMAIL und DEV_PASSWORD müssen in .env.local gesetzt sein.',
      { status: 500 }
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return new NextResponse(`Dev-Login fehlgeschlagen: ${error.message}`, { status: 401 })
  }

  const next = request.nextUrl.searchParams.get('next') ?? '/today'
  return NextResponse.redirect(new URL(next, request.url))
}
