import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  validateText,
  validateUUID,
  sanitizeErrorMessage,
} from '@/lib/validation';
import { checkRateLimit, rateLimitExceeded, getRateLimitHeaders } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

interface CreateRouteRequest {
  title: string;
  point_ids?: string[];
}

function validateUUIDs(ids: unknown, fieldName: string = 'point_ids'): string[] {
  if (!ids) return [];
  if (!Array.isArray(ids)) {
    throw new Error(`${fieldName} must be an array`);
  }
  if (ids.length > 100) {
    throw new Error(`${fieldName} array too large (max 100 items)`);
  }
  return ids.map((id: unknown, i: number) => validateUUID(id, `${fieldName}[${i}]`));
}

export async function GET(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.success) return rateLimitExceeded(rateLimitResult);

  try {
    const { data, error } = await supabase
      .from('routes')
      .select('id, title, point_ids, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: sanitizeErrorMessage(error) },
        { status: 500, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    return NextResponse.json(data, {
      headers: {
        ...getRateLimitHeaders(rateLimitResult),
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) },
      { status: 500, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request, { maxRequests: 30 });
  if (!rateLimitResult.success) return rateLimitExceeded(rateLimitResult);

  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 415, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    let body: CreateRouteRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    const title = validateText(body.title, 'Title', { maxLength: 200 });
    const point_ids = validateUUIDs(body.point_ids ?? []);

    const { data, error } = await supabase
      .from('routes')
      .insert([{ title, point_ids }])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: sanitizeErrorMessage(error) },
        { status: 500, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    return NextResponse.json(data, {
      status: 201,
      headers: getRateLimitHeaders(rateLimitResult),
    });
  } catch (error) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) },
      { status: error instanceof Error && error.message.includes('must') ? 400 : 500, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }
}
