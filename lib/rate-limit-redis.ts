/**
 * Production-Ready Rate Limiting with Redis Support
 * 
 * Features:
 * - Redis-based rate limiting (Upstash compatible)
 * - Automatic fallback to in-memory for development
 * - Sliding window algorithm
 * - Per-IP and per-identifier tracking
 * 
 * Setup for Production:
 * 1. Sign up at https://upstash.com/ (free tier available)
 * 2. Create a Redis database
 * 3. Add to .env.local:
 *    UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
 *    UPSTASH_REDIS_REST_TOKEN=your_token_here
 * 4. Install: npm install @upstash/redis
 * 
 * The system will automatically use Redis if configured,
 * otherwise falls back to in-memory (development only).
 */

import { env } from './env';

// ─── Redis Client (Dynamic Import) ──────────────────────────────────────────

let redisClient: any = null;
let redisAvailable = false;

// Try to initialize Redis client
async function initRedis() {
  if (redisClient !== null) return; // Already initialized
  
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!redisUrl || !redisToken) {
    console.warn('⚠️ Redis not configured. Using in-memory rate limiting (not suitable for production)');
    redisAvailable = false;
    return;
  }
  
  try {
    // Dynamic import to avoid errors if @upstash/redis is not installed
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    redisAvailable = true;
    if (env.isDevelopment) {
      console.log('✓ Redis rate limiting enabled');
    }
  } catch (error) {
    console.warn('⚠️ @upstash/redis not installed. Run: npm install @upstash/redis');
    console.warn('⚠️ Falling back to in-memory rate limiting');
    redisAvailable = false;
  }
}

// Initialize on module load (server-side only)
if (typeof window === 'undefined') {
  initRedis();
}

// ─── In-Memory Fallback ─────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
  identifier?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function getClientIP(request: Request): string {
  const headers = request.headers;
  
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// ─── Redis-Based Rate Limiting ──────────────────────────────────────────────

async function checkRateLimitRedis(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const resetTime = now + windowMs;
  
  try {
    // Use sorted set for sliding window
    // Each request is stored with its timestamp as score
    const pipeline = redisClient.pipeline();
    
    // Remove old entries outside the window
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count requests in current window
    pipeline.zcard(key);
    
    // Add current request
    pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    
    // Set expiration on the key
    pipeline.expire(key, Math.ceil(windowMs / 1000) + 10);
    
    const results = await pipeline.exec();
    const count = (results[1] as number) || 0;
    
    const remaining = Math.max(0, maxRequests - count - 1);
    const success = count < maxRequests;
    
    return {
      success,
      limit: maxRequests,
      remaining,
      reset: Math.ceil(resetTime / 1000),
    };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    // Fallback to allowing the request if Redis fails
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: Math.ceil(resetTime / 1000),
    };
  }
}

// ─── In-Memory Rate Limiting ────────────────────────────────────────────────

function checkRateLimitMemory(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  let entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }
  
  entry.count++;
  
  const remaining = Math.max(0, maxRequests - entry.count);
  const success = entry.count <= maxRequests;
  
  return {
    success,
    limit: maxRequests,
    remaining,
    reset: Math.ceil(entry.resetTime / 1000),
  };
}

// ─── Main Rate Limit Function ───────────────────────────────────────────────

export async function checkRateLimit(
  request: Request,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const {
    maxRequests = env.security.rateLimitMax,
    windowMs = env.security.rateLimitWindowMs,
    identifier = getClientIP(request),
  } = options;
  
  const key = `ratelimit:${identifier}`;
  
  // Use Redis if available, otherwise fall back to memory
  if (redisAvailable && redisClient) {
    return await checkRateLimitRedis(key, maxRequests, windowMs);
  } else {
    return checkRateLimitMemory(key, maxRequests, windowMs);
  }
}

// ─── Response Helpers ───────────────────────────────────────────────────────

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}

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
