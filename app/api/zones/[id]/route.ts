import { NextRequest, NextResponse } from 'next/server';
import type { GeoJSON } from 'geojson';
import { supabase } from '@/lib/supabase';
import {
  validateText,
  validateGeoJSON,
  validateZoneType,
  validateUUID,
  validateISODate,
  validateTags,
  sanitizeErrorMessage,
} from '@/lib/validation';
import { checkRateLimit, rateLimitExceeded, getRateLimitHeaders } from '@/lib/rate-limit';
import { calculatePolygonArea } from '@/lib/geo';

interface UpdateZoneRequest {
  title: string;
  name: string;
  type: string;
  instructions?: string;
  geojson: unknown;
  tags?: unknown;
  last_worked_at?: string;
  next_scheduled_work?: string;
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
    
    // Validate UUID
    const validatedId = validateUUID(id, 'Zone ID');

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
    let body: UpdateZoneRequest;
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
    const title = validateText(body.title, 'Title', { maxLength: 200 });
    const name = validateText(body.name || '', 'Name', { required: false, maxLength: 200 }) || null;
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

    // Update database
    const { data, error } = await supabase
      .from('zones')
      .update({ title, name, type, instructions, geojson, area_m2, tags, last_worked_at, next_scheduled_work })
      .eq('id', validatedId)
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

    if (!data) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { 
          status: 404,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    return NextResponse.json(data, {
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
    
    // Validate UUID
    const validatedId = validateUUID(id, 'Zone ID');

    // Delete from database
    const { error } = await supabase
      .from('zones')
      .delete()
      .eq('id', validatedId);

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

    return NextResponse.json(
      { success: true },
      {
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
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
