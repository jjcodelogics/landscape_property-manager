import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateUUID, sanitizeErrorMessage } from '@/lib/validation';
import { checkRateLimit, rateLimitExceeded, getRateLimitHeaders } from '@/lib/rate-limit';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResult = checkRateLimit(request, { maxRequests: 30 });
  if (!rateLimitResult.success) return rateLimitExceeded(rateLimitResult);

  try {
    const { id } = await params;
    const validatedId = validateUUID(id, 'Plan ID');

    const { error } = await supabase.from('daily_plans').delete().eq('id', validatedId);

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
