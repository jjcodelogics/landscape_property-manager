import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  validateText,
  validateUUID,
  validatePositiveInteger,
  sanitizeErrorMessage,
} from '@/lib/validation';
import { checkRateLimit, rateLimitExceeded, getRateLimitHeaders } from '@/lib/rate-limit';

interface CreatePlanRequest {
  plan_date: string;
  zone_ids?: string[];
  team_members?: number;
  hours_per_member?: number;
  notes?: string;
}

function validateUUIDs(ids: unknown, fieldName: string = 'zone_ids'): string[] {
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
      .from('daily_plans')
      .select('*')
      .order('plan_date', { ascending: false });

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

    let body: CreatePlanRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    if (!body.plan_date || typeof body.plan_date !== 'string') {
      return NextResponse.json(
        { error: 'plan_date is required' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }
    const plan_date = body.plan_date.slice(0, 10); // YYYY-MM-DD
    const zone_ids = validateUUIDs(body.zone_ids ?? []);
    const team_members = body.team_members
      ? validatePositiveInteger(body.team_members, 'Team members', { min: 1, max: 100 })
      : 1;
    const hours_per_member =
      typeof body.hours_per_member === 'number' && body.hours_per_member > 0
        ? body.hours_per_member
        : 8;
    const notes = validateText(body.notes || '', 'Notes', { required: false, maxLength: 2000 }) || null;

    const { data, error } = await supabase
      .from('daily_plans')
      .insert([{ plan_date, zone_ids, team_members, hours_per_member, notes }])
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
