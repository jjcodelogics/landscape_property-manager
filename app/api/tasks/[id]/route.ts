import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  validateText,
  validateTaskType,
  validateUUID,
  validatePositiveInteger,
  validateWeatherCondition,
  validateDifficulty,
  validateTaskMode,
  sanitizeErrorMessage,
} from '@/lib/validation';
import { checkRateLimit, rateLimitExceeded, getRateLimitHeaders } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

interface UpdateTaskRequest {
  task_type?: string;
  duration_minutes?: number;
  notes?: string;
  weather_condition?: string;
  difficulty?: string;
  mode?: string;
  productive_minutes?: number;
  non_productive_minutes?: number;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Apply rate limiting
  const rateLimitResult = checkRateLimit(request, { maxRequests: 30 });
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult);
  }

  try {
    const { id } = await params;

    // Validate task ID
    try {
      validateUUID(id, 'task ID');
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Invalid task ID' },
        {
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Validate Content-Type
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

    // Parse request body
    let body: UpdateTaskRequest;
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

    // Build update object with validation
    const updates: Record<string, unknown> = {};

    if (body.task_type !== undefined) {
      try {
        updates.task_type = validateTaskType(body.task_type);
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : 'Invalid task type' },
          {
            status: 400,
            headers: getRateLimitHeaders(rateLimitResult),
          }
        );
      }
    }

    if (body.duration_minutes !== undefined) {
      try {
        updates.duration_minutes = validatePositiveInteger(body.duration_minutes, 'duration_minutes');
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : 'Invalid duration_minutes' },
          {
            status: 400,
            headers: getRateLimitHeaders(rateLimitResult),
          }
        );
      }
    }

    if (body.notes !== undefined) {
      if (body.notes === null || body.notes.trim() === '') {
        updates.notes = null;
      } else {
        try {
          updates.notes = validateText(body.notes, 'notes', { maxLength: 500 });
        } catch (err) {
          return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Invalid notes' },
            {
              status: 400,
              headers: getRateLimitHeaders(rateLimitResult),
            }
          );
        }
      }
    }

    if (body.weather_condition !== undefined) {
      if (body.weather_condition === null) {
        updates.weather_condition = null;
      } else {
        try {
          updates.weather_condition = validateWeatherCondition(body.weather_condition);
        } catch (err) {
          return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Invalid weather_condition' },
            {
              status: 400,
              headers: getRateLimitHeaders(rateLimitResult),
            }
          );
        }
      }
    }

    if (body.difficulty !== undefined) {
      if (body.difficulty === null) {
        updates.difficulty = null;
      } else {
        try {
          updates.difficulty = validateDifficulty(body.difficulty);
        } catch (err) {
          return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Invalid difficulty' },
            {
              status: 400,
              headers: getRateLimitHeaders(rateLimitResult),
            }
          );
        }
      }
    }

    if (body.mode !== undefined) {
      if (body.mode === null) {
        updates.mode = null;
      } else {
        try {
          updates.mode = validateTaskMode(body.mode);
        } catch (err) {
          return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Invalid mode' },
            {
              status: 400,
              headers: getRateLimitHeaders(rateLimitResult),
            }
          );
        }
      }
    }

    if (body.productive_minutes !== undefined) {
      updates.productive_minutes = body.productive_minutes;
    }

    if (body.non_productive_minutes !== undefined) {
      updates.non_productive_minutes = body.non_productive_minutes;
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        {
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Update task in database
    const { data, error: dbError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select('*, zones(name, type)')
      .single();

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

    if (!data) {
      return NextResponse.json(
        { error: 'Task not found' },
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
  { params }: { params: Promise<{ id: string }> }
) {
  // Apply rate limiting
  const rateLimitResult = checkRateLimit(request, { maxRequests: 30 });
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult);
  }

  try {
    const { id } = await params;

    // Validate task ID
    try {
      validateUUID(id, 'task ID');
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Invalid task ID' },
        {
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Delete task from database
    const { error: dbError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

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
