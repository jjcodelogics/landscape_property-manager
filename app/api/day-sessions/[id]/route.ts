import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, rateLimitExceeded, getRateLimitHeaders } from '@/lib/rate-limit';
import { sanitizeErrorMessage } from '@/lib/validation';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const rateLimitResult = checkRateLimit(request, { maxRequests: 30 });
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult);
  }

  try {
    const { id } = await context.params;

    // End the session
    const { data, error: dbError } = await supabase
      .from('day_sessions')
      .update({ end_time: new Date().toISOString() })
      .eq('id', id)
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
      headers: getRateLimitHeaders(rateLimitResult),
    });
  } catch (err) {
    logger.error('Unexpected error:', err);
    return NextResponse.json(
      { error: sanitizeErrorMessage(err) },
      { status: 500, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }
}
