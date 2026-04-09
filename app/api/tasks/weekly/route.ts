import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, rateLimitExceeded, getRateLimitHeaders } from '@/lib/rate-limit';
import { sanitizeErrorMessage } from '@/lib/validation';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult);
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date query parameters are required' },
        { 
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Validate date format (basic ISO check)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: 'Dates must be in YYYY-MM-DD format' },
        { 
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const { data, error: dbError } = await supabase
      .from('tasks')
      .select('*, zones(id, title, name, type)')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
      .order('created_at', { ascending: false });

    if (dbError) {
      logger.error('Database error:', dbError);
      return NextResponse.json(
        { error: sanitizeErrorMessage(dbError) },
        { 
          status: 500,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    return NextResponse.json(data || [], {
      headers: {
        ...getRateLimitHeaders(rateLimitResult),
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
      },
    });
  } catch (err) {
    logger.error('Unexpected error:', err);
    return NextResponse.json(
      { error: sanitizeErrorMessage(err) },
      { 
        status: 500,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }
}
