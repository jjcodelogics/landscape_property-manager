/**
 * Rate limiting utilities
 * 
 * ⚠️ PRODUCTION WARNING ⚠️
 * This implementation uses in-memory storage which does NOT work correctly
 * in serverless environments (Vercel, AWS Lambda, etc.) where each request
 * may be handled by a different instance.
 * 
 * For production deployment, implement one of these solutions:
 * 
 * 1. Redis-based rate limiting (recommended):
 *    - Use Upstash Redis (serverless-friendly)
 *    - Use Vercel KV (built on Redis)
 *    - Install: npm install @upstash/redis
 * 
 * 2. Vercel Edge Config:
 *    - For read-heavy rate limiting scenarios
 *    - Good for API key-based limits
 * 
 * 3. Database-based rate limiting:
 *    - Use Supabase with proper indexing
 *    - Slower but works without additional services
 * 
 * 4. Third-party services:
 *    - Cloudflare Rate Limiting
 *    - API Gateway rate limiting (AWS, GCP, Azure)
 * 
 * Current implementation is suitable for:
 * - Development and testing
 * - Single-instance deployments
 * - Traditional server deployments (non-serverless)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// Note: This will reset when the server restarts
// For production with multiple instances, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed in the window
   * @default 60
   */
  maxRequests?: number;
  
  /**
   * Time window in milliseconds
   * @default 60000 (1 minute)
   */
  windowMs?: number;
  
  /**
   * Custom identifier (defaults to IP address)
   */
  identifier?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Get client IP address from request
 */
function getClientIP(request: Request): string {
  // Check various headers that might contain the real IP
  const headers = request.headers;
  
  // Vercel/Cloudflare/proxy headers
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback to generic identifier
  return 'unknown';
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  request: Request,
  options: RateLimitOptions = {}
): RateLimitResult {
  const {
    maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '60', 10),
    windowMs = 60 * 1000, // 1 minute
    identifier = getClientIP(request),
  } = options;
  
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  
  // Get or create entry
  let entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    // Create new entry
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }
  
  // Increment count
  entry.count++;
  
  const remaining = Math.max(0, maxRequests - entry.count);
  const success = entry.count <= maxRequests;
  
  return {
    success,
    limit: maxRequests,
    remaining,
    reset: Math.ceil(entry.resetTime / 1000), // Unix timestamp in seconds
  };
}

/**
 * Rate limit response headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}

/**
 * Create a rate-limited API response
 */
export function rateLimitExceeded(result: RateLimitResult): Response {
  const retryAfter = result.reset - Math.floor(Date.now() / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        ...getRateLimitHeaders(result),
      },
    }
  );
}
