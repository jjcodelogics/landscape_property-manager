import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, rateLimitExceeded, getRateLimitHeaders } from '@/lib/rate-limit';
import { sanitizeErrorMessage, validateDate, validatePositiveInteger } from '@/lib/validation';

interface CreateDayConfigRequest {
  date: string;
  team_members: number;
  hours_per_member: number;
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
      .from('day_config')
      .select('*')
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

    let body: CreateDayConfigRequest;
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

    // Validate date
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

    // Validate team_members
    if (typeof body.team_members !== 'number' || body.team_members < 1 || body.team_members > 50) {
      return NextResponse.json(
        { error: 'team_members must be between 1 and 50' },
        { 
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Validate hours_per_member
    if (typeof body.hours_per_member !== 'number' || body.hours_per_member <= 0 || body.hours_per_member > 24) {
      return NextResponse.json(
        { error: 'hours_per_member must be between 0 and 24' },
        { 
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Upsert day config (insert or update if exists)
    const { data, error: upsertError } = await supabase
      .from('day_config')
      .upsert({
        date: body.date,
        team_members: body.team_members,
        hours_per_member: body.hours_per_member,
      }, {
        onConflict: 'date',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Database error:', upsertError);
      return NextResponse.json(
        { error: sanitizeErrorMessage(upsertError) },
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
