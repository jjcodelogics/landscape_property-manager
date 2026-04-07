# Vercel Deployment Checklist

## ✅ Pre-Deployment Checklist

- [x] Build completes successfully (`npm run build`)
- [x] Environment variables documented in `.env.example`
- [x] `.gitignore` properly excludes `.env*` files
- [x] Next.js configuration is production-ready
- [ ] Supabase database schema applied (`supabase/schema.sql`)
- [ ] Supabase Row Level Security (RLS) policies configured
- [ ] Code pushed to Git repository

## 🚀 Quick Deploy

### 1. Prepare Supabase
```sql
-- Run supabase/schema.sql in your Supabase SQL Editor
-- Configure RLS policies if needed for security
```

### 2. Deploy to Vercel
**Via Dashboard:**
1. Visit https://vercel.com/new
2. Import your Git repository
3. Add environment variables (see below)
4. Click Deploy

**Via CLI:**
```bash
npm i -g vercel
vercel login
vercel --prod
```

### 3. Configure Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find these values:**
- Login to [Supabase Dashboard](https://app.supabase.com)
- Select your project → Settings → API
- Copy the **Project URL** and **anon/public** key

## 🔍 Post-Deployment Verification

- [ ] App loads at your Vercel URL
- [ ] Map displays correctly
- [ ] Can create/view zones (test at `/admin/zones`)
- [ ] Can log tasks
- [ ] Stats page shows data (`/stats`)
- [ ] No console errors in browser DevTools

## 🐛 Common Issues

**Build Fails:**
- Check Vercel build logs
- Verify all dependencies are in `package.json`
- Run `npm run build` locally to reproduce

**Map Not Loading:**
- Leaflet requires client-side rendering
- Ensure components using Leaflet are not server-rendered incorrectly

**Environment Variables Not Working:**
- Must be prefixed with `NEXT_PUBLIC_` for client access
- Redeploy after adding/changing variables

**Database Errors:**
- Verify Supabase URL and key are correct
- Check Supabase logs for RLS policy blocks
- Ensure schema is applied to your Supabase project

## 📚 Resources

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Docs](https://supabase.com/docs)
