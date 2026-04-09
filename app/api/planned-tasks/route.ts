import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, rateLimitExceeded, getRateLimitHeaders } from '@/lib/rate-limit';
import { sanitizeErrorMessage, validateDate, validateUUID, validatePositiveInteger, validateText } from '@/lib/validation';

interface CreatePlannedTaskRequest {
  date: string;
  zone_id: string;
  estimated_minutes?: number;
  notes?: string;
}

export async function GET(request: NextRequest) {
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

    // Validate date format
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
      .from('planned_tasks')
      .select('*, zones(id, title, name, type)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: sanitizeErrorMessage(dbError) },
        { 
          status: 500,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    return NextResponse.json(data || [], {
      headers: getRateLimitHeaders(rateLimitResult),
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: sanitizeErrorMessage(err) },
      { 
        status: 500,
        headers: getRateLimitHeaders(rateLimitResult),
      }
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
        { 
          status: 415,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    let body: CreatePlannedTaskRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { 
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Validate required fields
    const dateValidation = validateDate(body.date);
    if (!dateValidation.valid) {
      return NextResponse.json(
        { error: dateValidation.error },
        { 
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const zoneIdValidation = validateUUID(body.zone_id, 'Zone ID');

    // If estimated_minutes not provided, calculate from historical data
    let estimatedMinutes = body.estimated_minutes;
    
    if (!estimatedMinutes) {
      // Get average duration for this zone from past tasks
      const { data: avgData, error: avgError } = await supabase
        .from('tasks')
        .select('duration_minutes')
        .eq('zone_id', body.zone_id);

      if (!avgError && avgData && avgData.length > 0) {
        const total = avgData.reduce((sum, t) => sum + t.duration_minutes, 0);
        estimatedMinutes = Math.round(total / avgData.length);
      } else {
        // Fallback default
        estimatedMinutes = 30;
      }
    }

    const minutesValidation = validatePositiveInteger(estimatedMinutes);
    if (!minutesValidation.valid) {
      return NextResponse.json(
        { error: minutesValidation.error },
        { 
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }, 'Estimated minutes'); .from('planned_tasks')
      .insert({
        date: body.date,
        zone_id: body.zone_id,
        estimated_minutes: estimatedMinutes,
        notes: body.notes || null,
      })
      .select('*, zones(id, title, name, type)')
      .single();

    if (insertError) {
      // Check for duplicate constraint violation
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Deze zone is al gepland voor deze dag' },
          { 
            status: 409,
            headers: getRateLimitHeaders(rateLimitResult),
          }
        );
      }

      console.error('Database error:', insertError);
      return NextResponse.json(
        { error: sanitizeErrorMessage(insertError) },
        { 
          status: 500,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    return NextResponse.json(data, {
      status: 201,
      headers: getRateLimitHeaders(rateLimitResult),
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: sanitizeErrorMessage(err) },
      { 
        status: 500,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }
}
