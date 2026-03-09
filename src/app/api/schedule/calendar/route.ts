// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// Read Google OAuth credentials from ~/.openclaw/credentials/google-oauth.json
function getGoogleCredentials() {
  try {
    const credPath = join(process.env.HOME || '/Users/travis', '.openclaw/credentials/google-oauth.json')
    const data = readFileSync(credPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Failed to read Google credentials:', error)
    return null
  }
}

// Refresh Google OAuth access token
async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to refresh token')
  }
  
  return response.json()
}

// Fetch calendar events from Google Calendar API
async function fetchCalendarEvents(accessToken: string) {
  const now = new Date().toISOString()
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${nextWeek}&singleEvents=true&orderBy=startTime&maxResults=20`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch calendar: ${response.status}`)
  }
  
  const data = await response.json()
  return data.items || []
}

export async function GET() {
  try {
    const creds = getGoogleCredentials()
    
    if (!creds) {
      return NextResponse.json({ error: 'No credentials found' }, { status: 401 })
    }
    
    let accessToken = creds.access_token
    
    // Check if token needs refresh (simple expiry check)
    // For production, you'd check token expiry properly
    try {
      // Try to refresh if needed
      const tokenData = await refreshAccessToken(
        creds.refresh_token,
        creds.client_id,
        creds.client_secret
      )
      accessToken = tokenData.access_token
    } catch (refreshError) {
      console.log('Token refresh not needed or failed:', refreshError)
    }
    
    const events = await fetchCalendarEvents(accessToken)
    
    // Transform events to simpler format
    const transformedEvents = events.map((event: any) => ({
      id: event.id,
      summary: event.summary || '無標題',
      start: event.start,
      end: event.end,
      location: event.location,
      description: event.description,
    }))
    
    return NextResponse.json({ events: transformedEvents })
  } catch (error) {
    console.error('Calendar API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch calendar' },
      { status: 500 }
    )
  }
}
