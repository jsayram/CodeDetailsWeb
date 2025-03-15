import { createClerkSupabaseClient } from '@/services/supabase'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId, getToken } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = await getToken({ template: 'supabase' })
    if (!token) {
      return NextResponse.json({ error: 'No token available' }, { status: 400 })
    }
    
    // Test Supabase connection with token
    const supabase = createClerkSupabaseClient({ supabaseAccessToken: token })
    const { data, error } = await supabase.from('tasks').select('count').single()
    
    // JWT payload (DO NOT use in production!)
    const parts = token.split('.')
    const payload = parts.length === 3 ? JSON.parse(atob(parts[1])) : null
    
    return NextResponse.json({
      success: !error,
      userId,
      // Only include minimal needed info for debugging
      sub: payload?.sub,
      role: payload?.role,
      tokenAvailable: !!token,
      databaseResponse: error ? { message: error.message } : data
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}