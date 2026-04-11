import { NextRequest, NextResponse } from 'next/server';
import type { GeoJSON } from 'geojson';
import { supabase } from '@/lib/supabase';
import {
  validateText,
  validateGeoJSON,
  validateZoneType,
  validateISODate,
  validateTags,
  sanitizeErrorMessage,
} from '@/lib/validation';
import { checkRateLimit, rateLimitExceeded, getRateLimitHeaders } from '@/lib/rate-limit';
import { calculatePolygonArea } from '@/lib/geo';
import { logger } from '@/lib/logger';

interface CreateZoneRequest {
  title: string;
  type: string;
  instructions?: string;
  geojson: unknown;
  tags?: unknown;
  last_worked_at?: string;
  next_scheduled_work?: string;
  frequency?: string;
}

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult);
  }

  try {
    const { data, error: dbError } = await supabase
      .from('zones')
      .select('*')
      .order('title');

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

    return NextResponse.json(data, {
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
    let body: CreateZoneRequest;
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

    // Validate and sanitize inputs
    const title = validateText(body.title, 'Title', { maxLength: 200 });
    const type = validateZoneType(body.type);
    const instructions = validateText(body.instructions || '', 'Instructions', {
      required: false,
      maxLength: 2000,
    }) || null;
    const geojson = validateGeoJSON(body.geojson, 'GeoJSON');
    const area_m2 = Math.round(calculatePolygonArea(geojson as GeoJSON.Feature));
    const tags = validateTags(body.tags ?? []);
    const last_worked_at = validateISODate(body.last_worked_at, 'Last worked at', { required: false });
    const next_scheduled_work = validateISODate(body.next_scheduled_work, 'Next scheduled work', { required: false });
    const frequency = body.frequency?.trim() || null;

    // Insert into database
    const { data, error: dbError } = await supabase
      .from('zones')
      .insert([{ title, type, instructions, geojson, area_m2, tags, last_worked_at, next_scheduled_work, frequency }])
      .select()
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

    return NextResponse.json(data, {
      status: 201,
      headers: getRateLimitHeaders(rateLimitResult),
    });
  } catch (err) {
    logger.error('Validation or unexpected error:', err);
    return NextResponse.json(
      { error: sanitizeErrorMessage(err) },
      { 
        status: err instanceof Error && err.message.includes('must') ? 400 : 500,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }
}
