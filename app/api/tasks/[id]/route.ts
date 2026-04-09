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
    const taskIdValidation = validateUUID(id);
    if (!taskIdValidation.valid) {
      return NextResponse.json(
        { error: taskIdValidation.error },
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
      const validation = validateTaskType(body.task_type);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          {
            status: 400,
            headers: getRateLimitHeaders(rateLimitResult),
          }
        );
      }
      updates.task_type = body.task_type;
    }

    if (body.duration_minutes !== undefined) {
      const validation = validatePositiveInteger(body.duration_minutes, 'duration_minutes');
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          {
            status: 400,
            headers: getRateLimitHeaders(rateLimitResult),
          }
        );
      }
      updates.duration_minutes = body.duration_minutes;
    }

    if (body.notes !== undefined) {
      if (body.notes === null || body.notes.trim() === '') {
        updates.notes = null;
      } else {
        const validation = validateText(body.notes, 'notes', { maxLength: 500 });
        if (!validation.valid) {
          return NextResponse.json(
            { error: validation.error },
            {
              status: 400,
              headers: getRateLimitHeaders(rateLimitResult),
            }
          );
        }
        updates.notes = body.notes.trim();
      }
    }

    if (body.weather_condition !== undefined) {
      if (body.weather_condition === null) {
        updates.weather_condition = null;
      } else {
        const validation = validateWeatherCondition(body.weather_condition);
        if (!validation.valid) {
          return NextResponse.json(
            { error: validation.error },
            {
              status: 400,
              headers: getRateLimitHeaders(rateLimitResult),
            }
          );
        }
        updates.weather_condition = body.weather_condition;
      }
    }

    if (body.difficulty !== undefined) {
      if (body.difficulty === null) {
        updates.difficulty = null;
      } else {
        const validation = validateDifficulty(body.difficulty);
        if (!validation.valid) {
          return NextResponse.json(
            { error: validation.error },
            {
              status: 400,
              headers: getRateLimitHeaders(rateLimitResult),
            }
          );
        }
        updates.difficulty = body.difficulty;
      }
    }

    if (body.mode !== undefined) {
      if (body.mode === null) {
        updates.mode = null;
      } else {
        const validation = validateTaskMode(body.mode);
        if (!validation.valid) {
          return NextResponse.json(
            { error: validation.error },
            {
              status: 400,
              headers: getRateLimitHeaders(rateLimitResult),
            }
          );
        }
        updates.mode = body.mode;
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
      console.error('Database error:', dbError);
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
    const taskIdValidation = validateUUID(id);
    if (!taskIdValidation.valid) {
      return NextResponse.json(
        { error: taskIdValidation.error },
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
      console.error('Database error:', dbError);
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
