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

interface CreateTaskRequest {
  zone_id: string;
  task_type: string;
  duration_minutes: number;
  notes?: string;
  weather_condition?: string;
  difficulty?: string;
  mode?: string;
  productive_minutes?: number;
  non_productive_minutes?: number;
}

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult);
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, zones(name, type)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: sanitizeErrorMessage(error) },
        { 
          status: 500,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    return NextResponse.json(data, {
      headers: getRateLimitHeaders(rateLimitResult),
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) },
      { 
        status: 500,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }
}

export async function POST(request: NextRequest) {
  // Apply rate limiting (stricter for POST)
  const rateLimitResult = checkRateLimit(request, { maxRequests: 30 });
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult);
  }

  try {
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

    // Parse and validate request body
    let body: CreateTaskRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { 
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Validate and sanitize inputs
    const zone_id = validateUUID(body.zone_id, 'Zone ID');
    const task_type = validateTaskType(body.task_type);
    const duration_minutes = validatePositiveInteger(
      body.duration_minutes,
      'Duration',
      { min: 1, max: 1440 } // Max 24 hours
    );
    const notes = validateText(body.notes || '', 'Notes', {
      required: false,
      maxLength: 2000,
    });

    // Optional extended fields
    const weather_condition = body.weather_condition
      ? validateWeatherCondition(body.weather_condition)
      : null;
    const difficulty = body.difficulty
      ? validateDifficulty(body.difficulty)
      : null;
    const mode = body.mode
      ? validateTaskMode(body.mode)
      : null;
    const productive_minutes = body.productive_minutes !== undefined
      ? validatePositiveInteger(body.productive_minutes, 'Productive minutes', { min: 0, max: 1440 })
      : 0;
    const non_productive_minutes = body.non_productive_minutes !== undefined
      ? validatePositiveInteger(body.non_productive_minutes, 'Non-productive minutes', { min: 0, max: 1440 })
      : 0;

    // Insert into database
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        zone_id, task_type, duration_minutes, notes,
        weather_condition, difficulty, mode,
        productive_minutes, non_productive_minutes,
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: sanitizeErrorMessage(error) },
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
  } catch (error) {
    console.error('Validation or unexpected error:', error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) },
      { 
        status: error instanceof Error && error.message.includes('must') ? 400 : 500,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }
}
