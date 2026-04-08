# 🚀 Production Deployment Checklist

This document outlines critical steps needed before deploying to production.

## ⚠️ Critical Issues Fixed

The following issues have been addressed in this update:

### ✅ 1. Middleware Configuration
- **Fixed:** Renamed `proxy.ts` to `middleware.ts`
- **Status:** ✅ RESOLVED - Middleware will now be recognized by Next.js
- **Impact:** Security headers, CORS, and rate limiting now active

### ✅ 2. Enhanced Validation
- **Fixed:** Moved GeoJSON size check before intensive validation
- **Fixed:** Added array size limits (max 100 items) to prevent DoS
- **Fixed:** Improved UUID validation with better error messages
- **Status:** ✅ RESOLVED

### ✅ 3. TypeScript Strictness
- **Fixed:** Added `noUncheckedIndexedAccess` and `noImplicitOverride`
- **Status:** ✅ RESOLVED - Enhanced type safety

### ✅ 4. Console Logging
- **Fixed:** Wrapped environment validation log in development check
- **Status:** ✅ RESOLVED - No logs in production

### ✅ 5. Database Triggers
- **Created:** `migration_v3_triggers.sql` for array field validation
- **Status:** ✅ RESOLVED - Prevents orphaned references

## 🔴 Critical: Choose Your Rate Limiting Strategy

You have **TWO OPTIONS** for rate limiting:

### Option A: In-Memory (Current Default - Development Only)
**File:** `lib/rate-limit.ts`  
**Status:** ✅ Works for development  
**Limitation:** ⚠️ Will NOT work in serverless/multi-instance deployments  
**Use When:** Testing locally or single-server deployment

### Option B: Redis-Based (Production Recommended)
**File:** `lib/rate-limit-redis.ts` (created)  
**Status:** ⚠️ Requires setup  
**Setup Steps:**

1. **Sign up for Upstash Redis** (free tier available)
   ```
   https://upstash.com/
   ```

2. **Install the package:**
   ```bash
   npm install @upstash/redis
   ```

3. **Add to `.env.local`:**
   ```env
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token_here
   ```

4. **Update your API routes** to use the new rate limiter:
   ```typescript
   // Change this:
   import { checkRateLimit, rateLimitExceeded, getRateLimitHeaders } from '@/lib/rate-limit';
   
   // To this:
   import { checkRateLimit, rateLimitExceeded, getRateLimitHeaders } from '@/lib/rate-limit-redis';
   ```
   
   The new rate limiter automatically falls back to in-memory if Redis is not configured.

## 🔐 Critical: Database Row Level Security (RLS)

Your database has RLS enabled but requires authentication for writes. You must choose one of these approaches:

### Option 1: Disable RLS for Anonymous Access (Quick Fix)
**Use Case:** Development, internal tools, or when authentication isn't needed

**Run this SQL in Supabase:**
```sql
-- Zones
DROP POLICY "Authenticated users can insert zones" ON zones;
DROP POLICY "Authenticated users can update zones" ON zones;
DROP POLICY "Authenticated users can delete zones" ON zones;

CREATE POLICY "Allow insert zones" ON zones FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update zones" ON zones FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete zones" ON zones FOR DELETE USING (true);

-- Tasks
DROP POLICY "Authenticated users can insert tasks" ON tasks;

CREATE POLICY "Allow insert tasks" ON tasks FOR INSERT WITH CHECK (true);

-- Points
DROP POLICY "Authenticated users can insert points" ON points;
DROP POLICY "Authenticated users can update points" ON points;
DROP POLICY "Authenticated users can delete points" ON points;

CREATE POLICY "Allow insert points" ON points FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update points" ON points FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete points" ON points FOR DELETE USING (true);

-- Routes
DROP POLICY "Authenticated users can insert routes" ON routes;
DROP POLICY "Authenticated users can update routes" ON routes;
DROP POLICY "Authenticated users can delete routes" ON routes;

CREATE POLICY "Allow insert routes" ON routes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update routes" ON routes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete routes" ON routes FOR DELETE USING (true);

-- Daily Plans
DROP POLICY "Authenticated users can insert daily_plans" ON daily_plans;
DROP POLICY "Authenticated users can update daily_plans" ON daily_plans;
DROP POLICY "Authenticated users can delete daily_plans" ON daily_plans;

CREATE POLICY "Allow insert daily_plans" ON daily_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update daily_plans" ON daily_plans FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete daily_plans" ON daily_plans FOR DELETE USING (true);
```

### Option 2: Use Service Role Key (Server-Side Only)
**Use Case:** Keep RLS but bypass it on the server

1. **Get your service role key** from Supabase dashboard
2. **Add to `.env.local`:**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Create a service client** in `lib/supabase.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js';
   import { env } from './env';

   // Existing client (for reads)
   export const supabase = createClient(
     env.supabase.url,
     env.supabase.anonKey,
     { auth: { persistSession: false } }
   );

   // Service client (for writes - server-side only!)
   export const supabaseAdmin = env.supabase.serviceRoleKey
     ? createClient(env.supabase.url, env.supabase.serviceRoleKey, {
         auth: { persistSession: false },
       })
     : supabase;
   ```

4. **Use `supabaseAdmin` for all write operations** in your API routes

### Option 3: Implement Supabase Authentication (Production Recommended)
**Use Case:** Multi-user application with user management

1. **Enable Supabase Auth** in your project
2. **Add authentication UI** (login/signup)
3. **Protect routes** with middleware
4. **Modify RLS policies** to check user ownership

## 📊 Production Environment Variables

Ensure these are set in your production environment:

### Required
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Optional but Recommended
```env
# Service role key (⚠️ Server-side only, never expose to client!)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# CORS (comma-separated)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_MAX=60
RATE_LIMIT_WINDOW_MS=60000

# Redis (recommended for production)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

## 🗄️ Database Migrations

Run these migrations in order on your Supabase database:

1. ✅ `supabase/schema.sql` - Initial schema (should be done)
2. ✅ `supabase/migration_v2.sql` - Add new features (should be done)
3. **🆕 `supabase/migration_v3_triggers.sql`** - Array validation triggers (NEW!)

To apply the new migration:
1. Go to Supabase SQL Editor
2. Copy contents of `migration_v3_triggers.sql`
3. Run the SQL

## 🔒 Security Checklist

- ✅ Middleware enabled (renamed to middleware.ts)
- ✅ Security headers configured
- ✅ Input validation on all endpoints
- ✅ Rate limiting implemented
- ⚠️ **Choose RLS strategy** (see above)
- ⚠️ **Setup Redis for production** (see above)
- ⚠️ Ensure HTTPS is enabled in production
- ⚠️ Review CORS allowed origins
- ✅ Error messages sanitized
- ✅ Environment variables validated

## 📦 Before Deploying

### 1. Install Production Dependencies (if using Redis)
```bash
npm install @upstash/redis
```

### 2. Build Test
```bash
npm run build
```

Check for any TypeScript errors or build issues.

### 3. Run Database Migrations
Apply `migration_v3_triggers.sql` to your Supabase database.

### 4. Configure Environment Variables
Set all required variables in your hosting platform (Vercel, Netlify, etc.)

### 5. Test Rate Limiting
Make multiple requests to verify rate limiting works correctly.

### 6. Test RLS Configuration
Try creating/updating/deleting data to ensure RLS is configured correctly.

## 🚀 Deployment Platforms

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Important for Vercel:**
- Use Vercel KV or Upstash Redis for rate limiting
- Set environment variables in Vercel dashboard
- Enable "Automatically expose System Environment Variables" if needed

### Other Platforms
- Netlify: Works well, use Upstash Redis
- Railway: Supports Redis natively
- AWS/GCP/Azure: Use managed Redis service

## 📊 Monitoring Recommendations

### Essential Monitoring
1. **Error Tracking:** Sentry, LogRocket
2. **Performance:** Vercel Analytics, New Relic
3. **Uptime:** UptimeRobot, Pingdom
4. **Database:** Supabase dashboard metrics

### Key Metrics to Monitor
- API response times
- Rate limit hit rate
- Database query performance
- Error rates
- User sessions (if implementing auth)

## 🆘 Troubleshooting

### Issue: Middleware not working
**Fix:** Ensure file is named `middleware.ts` (not `proxy.ts`)

### Issue: RLS blocking all writes
**Fix:** Choose one of the RLS options above

### Issue: Rate limiting not working in production
**Fix:** Implement Redis-based rate limiting

### Issue: CORS errors
**Fix:** Add your domain to `ALLOWED_ORIGINS` in environment variables

### Issue: TypeScript errors after updates
**Fix:** Run `npm install` and restart your IDE

## 📚 Additional Resources

- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Upstash Redis Docs](https://docs.upstash.com/redis)
- [Vercel Deployment](https://vercel.com/docs)

---

## ✨ Summary of Changes

All issues from the audit have been addressed:

1. ✅ **Middleware:** Renamed and configured correctly
2. ✅ **Validation:** Enhanced with better limits and early size checks
3. ✅ **TypeScript:** Stricter configuration enabled
4. ✅ **Logging:** Removed production console.logs
5. ✅ **Database:** Added triggers for array field validation
6. ✅ **Rate Limiting:** Created Redis-based option for production
7. ✅ **Security:** Body size limits added to Next.js config

**Your application is now production-ready!** Just complete the configuration steps above based on your deployment needs.
