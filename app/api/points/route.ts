import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  validateText,
  validateGeoJSON,
  validatePointType,
  sanitizeErrorMessage,
} from '@/lib/validation';
import { checkRateLimit, rateLimitExceeded, getRateLimitHeaders } from '@/lib/rate-limit';

interface CreatePointRequest {
  title: string;
  type: string;
  notes?: string;
  geojson: unknown;
}

export async function GET(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.success) return rateLimitExceeded(rateLimitResult);

  try {
    const { data, error } = await supabase
      .from('points')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: sanitizeErrorMessage(error) },
        { status: 500, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    return NextResponse.json(data, { headers: getRateLimitHeaders(rateLimitResult) });
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

    let body: CreatePointRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    const title = validateText(body.title, 'Title', { maxLength: 200 });
    const type = validatePointType(body.type);
    const notes = validateText(body.notes || '', 'Notes', { required: false, maxLength: 2000 }) || null;
    const geojson = validateGeoJSON(body.geojson, 'GeoJSON');

    const { data, error } = await supabase
      .from('points')
      .insert([{ title, type, notes, geojson }])
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
