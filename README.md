# LandscapeManager

A production-ready Next.js app for managing landscaping tasks across large facility terrains.

## Features

- 🗺️ Interactive Leaflet map with color-coded zone polygons (grass, waste, maintenance)
- 📋 Zone sidebar with Markdown-rendered instructions
- ✅ Task logging modal (mowing, waste collection, maintenance)
- 📊 Stats page with weekly totals and per-zone breakdowns
- 🛠️ Admin zone editor with draw/edit polygon tools (leaflet-draw)
- 🗄️ Supabase backend for zones and tasks persistence

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **Supabase** for database
- **Leaflet** + **leaflet-draw** for mapping
- **react-markdown** + **remark-gfm** for Markdown rendering
- **lucide-react** for icons

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Run the SQL schema in your Supabase project:
   ```
   supabase/schema.sql
   ```

3. Install dependencies and run the development server:
   ```bash
   npm install
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/zones` | List all zones |
| POST | `/api/zones` | Create a zone |
| PUT | `/api/zones/[id]` | Update a zone |
| DELETE | `/api/zones/[id]` | Delete a zone |
| GET | `/api/tasks` | List recent tasks |
| POST | `/api/tasks` | Log a task |
| GET | `/api/stats` | Get zone statistics |

## Deployment to Vercel

### Prerequisites
1. A [Vercel account](https://vercel.com/signup) (free tier works great)
2. A Supabase project with the schema from `supabase/schema.sql` applied
3. Your Supabase URL and anon key ready

### Deploy Steps

#### Option 1: Deploy via Vercel Dashboard
1. Push your code to GitHub, GitLab, or Bitbucket
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key
5. Click **Deploy**

#### Option 2: Deploy via Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# For production deployment
vercel --prod
```

### Setting Environment Variables

In your Vercel project dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add each variable from `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Select which environments (Production, Preview, Development)
4. Click **Save**

### Post-Deployment
- Your app will be live at `https://your-project.vercel.app`
- Vercel automatically handles SSL certificates
- Every git push triggers a new deployment
- Preview deployments are created for branches and PRs

### Troubleshooting
- **Build errors**: Check the build logs in Vercel dashboard
- **Environment variables not working**: Ensure they're prefixed with `NEXT_PUBLIC_` and redeploy
- **Map not loading**: Check browser console for CORS or API errors
- **Database errors**: Verify Supabase credentials and RLS policies
