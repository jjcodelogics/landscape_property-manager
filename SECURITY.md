# Security Implementation Guide

This document outlines the security measures implemented in the Landscape Property Manager application.

## 🔒 Security Features Implemented

### 1. Environment Variable Protection

**Location:** `lib/env.ts`, `.env.example`

- **Type-safe environment variable access** with runtime validation
- **URL validation** for Supabase endpoints
- **Secure secrets management** with `.gitignore` protection
- **Production/development environment separation**

**Setup:**
```bash
# Copy and configure environment variables
cp .env.example .env
# Edit .env with your actual values
```

### 2. Security Headers

**Location:** `middleware.ts`

Implemented headers:
- **X-Frame-Options: DENY** - Prevents clickjacking attacks
- **X-Content-Type-Options: nosniff** - Prevents MIME type sniffing
- **X-XSS-Protection** - Enables browser XSS filter
- **Referrer-Policy** - Controls referrer information
- **Content-Security-Policy (CSP)** - Restricts resource loading
- **Permissions-Policy** - Restricts browser features
- **Strict-Transport-Security (HSTS)** - Forces HTTPS in production

### 3. CORS Configuration

**Location:** `middleware.ts`

- Configurable allowed origins via `ALLOWED_ORIGINS` environment variable
- Automatic localhost allowance in development
- Proper preflight (OPTIONS) request handling
- Credentials support when needed

### 4. Rate Limiting

**Location:** `lib/rate-limit.ts`

- **In-memory rate limiting** (60 requests/minute by default)
- **Per-IP tracking** with configurable limits
- **Different limits for read vs. write operations**
  - GET requests: 60/minute
  - POST/PUT/DELETE: 30/minute
- **Rate limit headers** (`X-RateLimit-*`) in responses
- **Automatic cleanup** of expired entries

**Note:** For production with multiple server instances, consider using Redis for distributed rate limiting.

### 5. Input Validation & Sanitization

**Location:** `lib/validation.ts`

Comprehensive validation functions:
- **String sanitization** - Removes control characters, null bytes
- **Type validation** - Ensures correct data types
- **Enum validation** - Validates against allowed values
- **UUID validation** - Proper UUID format checking
- **GeoJSON validation** - Structure and size validation (max 1MB)
- **Length constraints** - Prevents oversized inputs
- **Integer range validation** - Min/max bounds checking

### 6. API Route Security

**Locations:** `app/api/zones/route.ts`, `app/api/zones/[id]/route.ts`, `app/api/tasks/route.ts`

All API routes include:
- ✅ Rate limiting
- ✅ Content-Type validation
- ✅ JSON parsing error handling
- ✅ Input validation and sanitization
- ✅ Safe error messages (no information leakage)
- ✅ Proper HTTP status codes
- ✅ UUID validation for IDs

### 7. Database Security

**Location:** `supabase/schema.sql`

Implemented measures:
- **Row Level Security (RLS)** enabled on all tables
- **Database constraints**:
  - Check constraints for enums
  - Length constraints (name: 200 chars, instructions/notes: 2000 chars)
  - Size constraints (GeoJSON: 1MB max)
  - Range constraints (duration: 1-1440 minutes)
- **Performance indexes** on commonly queried columns
- **Cascade deletion** for referential integrity
- **Documentation comments** on tables and columns

**Note:** Current RLS policies allow public access. For production with authentication, update policies to check `auth.role()`.

### 8. Error Handling

**Location:** `lib/validation.ts` - `sanitizeErrorMessage()`

- Prevents information leakage in production
- Sanitizes database errors
- Generic messages for common errors
- Detailed messages in development only

### 9. Next.js Configuration

**Location:** `next.config.ts`

Security settings:
- `poweredByHeader: false` - Hides Next.js version
- `reactStrictMode: true` - Better error detection
- `compress: true` - Response compression
- Image optimization with format restrictions

## 🚀 Deployment Checklist

Before deploying to production:

### Environment Variables
- [ ] Set all required environment variables in `.env`
- [ ] Configure `ALLOWED_ORIGINS` for your domain
- [ ] Never commit `.env` file to version control
- [ ] Use platform-specific secret management (Vercel, AWS, etc.)

### Supabase Configuration
- [ ] Apply the schema with RLS policies: `psql -f supabase/schema.sql`
- [ ] Review and update RLS policies for authentication if needed
- [ ] Enable Supabase Auth if user authentication is required
- [ ] Configure Supabase email templates
- [ ] Set up database backups

### Authentication (Optional)
If you need authentication:
```sql
-- Update RLS policies to require authentication
drop policy if exists "Allow insert for zones" on zones;
create policy "Authenticated users can insert zones"
  on zones for insert
  to authenticated
  with check (true);

-- Repeat for other write operations
```

### Rate Limiting
- [ ] Review rate limits for your use case
- [ ] Consider Redis for distributed rate limiting
- [ ] Monitor rate limit violations
- [ ] Set up alerts for abuse

### HTTPS
- [ ] Ensure HTTPS is enabled (required for HSTS)
- [ ] Configure SSL/TLS certificates
- [ ] Test HTTPS redirection

### Monitoring
- [ ] Set up error logging (Sentry, LogRocket, etc.)
- [ ] Monitor API response times
- [ ] Track rate limit violations
- [ ] Set up uptime monitoring

## 🔍 Security Testing

### Manual Testing
```bash
# Test rate limiting
for i in {1..65}; do curl http://localhost:3000/api/zones; done

# Test invalid input
curl -X POST http://localhost:3000/api/zones \
  -H "Content-Type: application/json" \
  -d '{"name":"","type":"invalid","geojson":{}}'

# Test SQL injection protection (should fail gracefully)
curl http://localhost:3000/api/zones/'; DROP TABLE zones;--
```

### Automated Testing
Consider adding:
- Input validation tests
- Rate limiting tests
- CSRF protection tests (if using forms)
- XSS prevention tests

## 📋 Additional Security Recommendations

### For Production Deployment

1. **Add Authentication**
   - Implement Supabase Auth
   - Add JWT validation
   - Update RLS policies

2. **Add CSRF Protection**
   - For form submissions
   - Use CSRF tokens for state-changing operations

3. **Implement Audit Logging**
   - Log all modifications (who, what, when)
   - Track failed authentication attempts
   - Monitor suspicious activities

4. **Add Request Size Limits**
   ```typescript
   // In API routes
   export const config = {
     api: {
       bodyParser: {
         sizeLimit: '1mb',
       },
     },
   };
   ```

5. **Use Content Security Policy (CSP) Nonce**
   - For inline scripts in production
   - Rotate nonces per request

6. **Set Up Web Application Firewall (WAF)**
   - Cloudflare, AWS WAF, or similar
   - DDoS protection
   - Bot protection

7. **Regular Security Updates**
   - Keep dependencies updated
   - Run `npm audit` regularly
   - Subscribe to security advisories

8. **Penetration Testing**
   - Hire security professionals
   - Run OWASP ZAP or similar tools
   - Test for common vulnerabilities

## 🚨 Incident Response

If a security issue is discovered:

1. **Assess the severity** - Is data compromised? Is the service down?
2. **Contain the breach** - Disable affected functionality
3. **Investigate** - Review logs, identify the attack vector
4. **Remediate** - Fix the vulnerability
5. **Document** - Record what happened and how it was fixed
6. **Notify** - Inform affected users if necessary
7. **Improve** - Update security measures and testing

## 📞 Security Contacts

Maintain a list of:
- Development team security lead
- Hosting provider security contact
- Third-party service contacts (Supabase, CDN, etc.)
- Incident response team

## 🔗 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables#security)
- [Supabase Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

---

**Last Updated:** April 7, 2026  
**Version:** 1.0.0
