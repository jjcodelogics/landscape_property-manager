import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateText, validateUUID, sanitizeErrorMessage } from '@/lib/validation';
import { checkRateLimit, rateLimitExceeded, getRateLimitHeaders } from '@/lib/rate-limit';

function validateUUIDs(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  return ids.map((id: unknown, i: number) => validateUUID(id, `point_ids[${i}]`));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResult = checkRateLimit(request, { maxRequests: 30 });
  if (!rateLimitResult.success) return rateLimitExceeded(rateLimitResult);

  try {
    const { id } = await params;
    const validatedId = validateUUID(id, 'Route ID');

    let body: { title?: string; point_ids?: string[] };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    const title = validateText(body.title || '', 'Title', { maxLength: 200 });
    const point_ids = validateUUIDs(body.point_ids ?? []);

    const { data, error } = await supabase
      .from('routes')
      .update({ title, point_ids })
      .eq('id', validatedId)
      .select()
      .single();

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
      { status: error instanceof Error && error.message.includes('must') ? 400 : 500, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResult = checkRateLimit(request, { maxRequests: 30 });
  if (!rateLimitResult.success) return rateLimitExceeded(rateLimitResult);

  try {
    const { id } = await params;
    const validatedId = validateUUID(id, 'Route ID');

    const { error } = await supabase.from('routes').delete().eq('id', validatedId);

    if (error) {
      return NextResponse.json(
        { error: sanitizeErrorMessage(error) },
        { status: 500, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    return NextResponse.json({ success: true }, { headers: getRateLimitHeaders(rateLimitResult) });
  } catch (error) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) },
      { status: error instanceof Error && error.message.includes('must') ? 400 : 500, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }
}
