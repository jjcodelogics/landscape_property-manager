import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, rateLimitExceeded, getRateLimitHeaders } from '@/lib/rate-limit';
import { sanitizeErrorMessage } from '@/lib/validation';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult);
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Get all sessions for the specified date
    const { data: sessions, error: sessionsError } = await supabase
      .from('day_sessions')
      .select('id, date, mode, start_time, end_time, non_productive_reason, created_at')
      .eq('date', date)
      .order('start_time', { ascending: true });

    if (sessionsError) {
      logger.error('Database error:', sessionsError);
      return NextResponse.json(
        { error: sanitizeErrorMessage(sessionsError) },
        { status: 500, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Calculate totals
    let total_productive_minutes = 0;
    let total_non_productive_minutes = 0;
    let active_session = null;

    for (const session of sessions || []) {
      const start = new Date(session.start_time).getTime();
      const end = session.end_time ? new Date(session.end_time).getTime() : Date.now();
      const duration_minutes = Math.floor((end - start) / 60000);

      if (session.mode === 'productive') {
        total_productive_minutes += duration_minutes;
      } else {
        total_non_productive_minutes += duration_minutes;
      }

      if (!session.end_time) {
        active_session = session;
      }
    }

    return NextResponse.json({
      sessions: sessions || [],
      summary: {
        total_productive_minutes,
        total_non_productive_minutes,
        active_session,
      },
    }, {
      headers: {
        ...getRateLimitHeaders(rateLimitResult),
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (err) {
    logger.error('Unexpected error:', err);
    return NextResponse.json(
      { error: sanitizeErrorMessage(err) },
      { status: 500, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request, { maxRequests: 30 });
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult);
  }

  try {
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 415, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    const { mode, non_productive_reason } = body;

    if (!mode || (mode !== 'productive' && mode !== 'non_productive')) {
      return NextResponse.json(
        { error: 'Mode must be either "productive" or "non_productive"' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Check for active session
    const { data: activeSession } = await supabase
      .from('day_sessions')
      .select('id, date, mode, start_time, end_time, non_productive_reason, created_at')
      .eq('date', today)
      .is('end_time', null)
      .single();

    // If there's an active session, end it first
    if (activeSession) {
      await supabase
        .from('day_sessions')
        .update({ end_time: new Date().toISOString() })
        .eq('id', activeSession.id);
    }

    // Create new session
    const { data, error: dbError } = await supabase
      .from('day_sessions')
      .insert([{
        date: today,
        mode,
        non_productive_reason: mode === 'non_productive' ? non_productive_reason : null,
        start_time: new Date().toISOString(),
      }])
      .select()
      .single();

    if (dbError) {
      logger.error('Database error:', dbError);
      return NextResponse.json(
        { error: sanitizeErrorMessage(dbError) },
        { status: 500, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    return NextResponse.json(data, {
      status: 201,
      headers: getRateLimitHeaders(rateLimitResult),
    });
  } catch (err) {
    logger.error('Validation or unexpected error:', err);
    return NextResponse.json(
      { error: sanitizeErrorMessage(err) },
      { status: 500, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }
}
