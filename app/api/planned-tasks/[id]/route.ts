import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, rateLimitExceeded, getRateLimitHeaders } from '@/lib/rate-limit';
import { sanitizeErrorMessage, validateUUID, validatePositiveInteger } from '@/lib/validation';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface UpdatePlannedTaskRequest {
  estimated_minutes?: number;
  team_members?: number;
  date?: string;
  notes?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const rateLimitResult = checkRateLimit(request, { maxRequests: 30 });
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult);
  }

  try {
    const { id } = await params;
    
    const validatedId = validateUUID(id, 'Planned task ID');

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

    let body: UpdatePlannedTaskRequest;
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

    // Build update object with only provided fields
    const updateData: Partial<{
      estimated_minutes: number;
      team_members: number;
      date: string;
      notes: string | null;
    }> = {};

    if (body.estimated_minutes !== undefined) {
      updateData.estimated_minutes = validatePositiveInteger(
        body.estimated_minutes,
        'Estimated minutes'
      );
    }

    if (body.team_members !== undefined) {
      updateData.team_members = validatePositiveInteger(
        body.team_members,
        'Team members'
      );
    }

    if (body.date !== undefined) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(body.date)) {
        return NextResponse.json(
          { error: 'Date must be in YYYY-MM-DD format' },
          {
            status: 400,
            headers: getRateLimitHeaders(rateLimitResult),
          }
        );
      }
      updateData.date = body.date;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes?.trim() || null;
    }

    // Update in database
    const { data, error: updateError } = await supabase
      .from('planned_tasks')
      .update(updateData)
      .eq('id', validatedId)
      .select('*, zones(id, title, type)')
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'Deze zone is al gepland voor deze dag' },
          {
            status: 409,
            headers: getRateLimitHeaders(rateLimitResult),
          }
        );
      }

      logger.error('Database error:', updateError);
      return NextResponse.json(
        { error: sanitizeErrorMessage(updateError) },
        {
          status: 500,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Planned task not found' },
        {
          status: 404,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    return NextResponse.json(data, {
      headers: getRateLimitHeaders(rateLimitResult),
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

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const rateLimitResult = checkRateLimit(request, { maxRequests: 30 });
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult);
  }

  try {
    const { id } = await params;
    
    const validatedDeleteId = validateUUID(id, 'Planned task ID');

    const { error: deleteError } = await supabase
      .from('planned_tasks')
      .delete()
      .eq('id', validatedDeleteId);

    if (deleteError) {
      logger.error('Database error:', deleteError);
      return NextResponse.json(
        { error: sanitizeErrorMessage(deleteError) },
        { 
          status: 500,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    return NextResponse.json(
      { success: true },
      {
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
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
