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
