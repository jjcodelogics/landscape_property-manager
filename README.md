# 🌿 LandscapeManager

> A production-ready Next.js application for managing landscaping operations across large facility terrains with interactive mapping, task tracking, and analytics.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black.svg)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## ✨ Key Features

- 🗺️ **Interactive GIS Mapping** - Leaflet-based interface with color-coded zones
- 📋 **Zone Management** - Create, edit, and manage geographical work zones
- ✅ **Task Tracking** - Log completed work with duration, weather, and difficulty
- 📊 **Analytics Dashboard** - KPI tracking, productivity metrics, and zone statistics
- 🗓️ **Daily Planning** - Schedule work and manage team resources
- 🛤️ **Route Planning** - Define and manage collection/maintenance routes
- 🔐 **Production Ready** - Security headers, rate limiting, input validation
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- A [Supabase](https://supabase.com/) account (free tier available)

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Setup database:**
   - Open your Supabase SQL Editor
   - Run `supabase/schema.sql`
   - Run `supabase/migration_v2.sql`
   - Run `supabase/migration_v3_triggers.sql`

4. **Start development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see your app! 🎉

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, TypeScript)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Mapping:** [Leaflet](https://leafletjs.com/) + [Leaflet Draw](https://leaflet.github.io/Leaflet.draw/)
- **Markdown:** [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Type Safety:** TypeScript with strict mode


## 📖 Documentation

- **[Project Overview](PROJECT.md)** - Comprehensive project documentation
- **[Production Deployment Guide](docs/PRODUCTION_DEPLOYMENT.md)** - Complete deployment checklist
- **[Migration Guide](docs/MIGRATION_GUIDE.md)** - Recent updates and changes
- **[Audit Completion Report](docs/AUDIT_COMPLETION.md)** - Security audit summary

## 🏗️ Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes (zones, tasks, stats, etc.)
│   ├── admin/             # Admin interface for zone management
│   ├── kpi/               # KPI analytics dashboard
│   ├── plan/              # Daily work planning interface
│   ├── routes/            # Route planning interface
│   ├── stats/             # Statistics dashboard
│   └── page.tsx           # Main map interface
├── components/            # React components
│   ├── AdminMap.tsx       # Admin map with drawing tools
│   ├── ErrorBoundary.tsx  # Error handling component
│   ├── Map.tsx            # Main map display
│   ├── Sidebar.tsx        # Zone detail sidebar
│   ├── TaskForm.tsx       # Task logging form
│   └── ZoneInstructionsGenerator.tsx
├── lib/                   # Utility libraries
│   ├── env.ts            # Environment validation
│   ├── geo.ts            # Geospatial calculations
│   ├── rate-limit.ts     # In-memory rate limiting
│   ├── rate-limit-redis.ts  # Production rate limiting
│   ├── supabase.ts       # Database client
│   ├── types.ts          # TypeScript types
│   ├── validation.ts     # Input validation & sanitization
│   └── zones.ts          # Zone utilities
├── supabase/             # Database schema
│   ├── schema.sql        # Initial schema
│   ├── migration_v2.sql  # Feature additions
│   └── migration_v3_triggers.sql  # Array validation triggers
└── docs/                 # Documentation
    ├── PRODUCTION_DEPLOYMENT.md
    ├── MIGRATION_GUIDE.md
    └── AUDIT_COMPLETION.md
```

## 🔌 API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/zones` | GET | List all zones |
| `/api/zones` | POST | Create a new zone |
| `/api/zones/[id]` | PUT | Update a zone |
| `/api/zones/[id]` | DELETE | Delete a zone |
| `/api/tasks` | GET | List recent tasks |
| `/api/tasks` | POST | Log a completed task |
| `/api/points` | GET, POST | Manage point markers |
| `/api/routes` | GET, POST | Manage routes |
| `/api/plans` | GET, POST | Manage daily plans |
| `/api/stats` | GET | Zone statistics and KPIs |

All routes include:
- ✅ Rate limiting (60 requests/minute)
- ✅ Input validation and sanitization
- ✅ Error handling with sanitized messages
- ✅ Security headers via middleware

## 🚢 Deployment


### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/landscape-property-manager)

**Quick Deploy:**
```bash
npm i -g vercel
vercel login
vercel --prod
```

**Environment Variables:**
Configure these in your Vercel dashboard or CLI:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `UPSTASH_REDIS_REST_URL` (optional, for production rate limiting)
- `UPSTASH_REDIS_REST_TOKEN` (optional)

📖 **Full deployment guide:** See [docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md)

### Other Platforms

- **Netlify:** Works great, use Upstash Redis for rate limiting
- **Railway:** Native Redis support available
- **Docker:** Compatible with containerization

## 🧪 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Code Quality

- ✅ TypeScript strict mode with additional checks
- ✅ ESLint with Next.js recommended rules
- ✅ Prettier for code formatting
- ✅ EditorConfig for consistent editor settings

### Testing

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build test
npm run build
```

## 🔒 Security

This application implements multiple security layers:

- ✅ **Middleware Security Headers** - CSP, XSS protection, frame options
- ✅ **Rate Limiting** - IP-based request throttling (in-memory + Redis ready)
- ✅ **Input Validation** - Comprehensive sanitization on all user inputs
- ✅ **SQL Injection Prevention** - Supabase parameterized queries
- ✅ **Error Sanitization** - No sensitive data leaked in error messages
- ✅ **CORS Configuration** - Whitelist-based origin control
- ✅ **Body Size Limits** - Prevents DoS via oversized requests
- ✅ **Database RLS** - Row Level Security policies enabled

See [docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md) for security configuration.

## 🗺️ Map Features

- **Zone Types:** Grass (mowing), Waste (collection), Maintenance
- **Color-Coded Overlays:** Visual zone identification
- **Draw Tools:** Create and edit zone boundaries
- **Click Interactions:** View zone details and instructions
- **Responsive Design:** Touch-friendly mobile interface
- **Area Calculation:** Automatic polygon area computation
- **Tooltips:** Hover to see zone names

## 📊 Analytics & KPIs

- **Time per m²:** Efficiency metrics by zone type
- **Productive vs Non-Productive:** Task mode analysis
- **Variance Analysis:** Consistency tracking
- **Weekly Totals:** Rolling time summaries
- **Zone Statistics:** Per-zone completion history
- **Task History:** Detailed activity logs

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the existing code style
- Run `npm run lint` before committing
- Use meaningful commit messages
- Add comments for complex logic

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Maps powered by [Leaflet](https://leafletjs.com/) and [OpenStreetMap](https://www.openstreetmap.org/)
- Database by [Supabase](https://supabase.com/)
- Icons from [Lucide](https://lucide.dev/)

## 🐛 Troubleshooting

- **Build errors:** Check the build logs in Vercel dashboard
- **Environment variables not working:** Ensure they're prefixed with `NEXT_PUBLIC_` and redeploy
- **Map not loading:** Check browser console for CORS or API errors
- **Database errors:** Verify Supabase credentials and RLS policies
- **Rate limit issues:** See [Production Deployment Guide](docs/PRODUCTION_DEPLOYMENT.md)

## 📧 Support

- 📖 Check the [documentation](docs/)
- 🐛 Report bugs via GitHub Issues
- 💡 Request features via GitHub Discussions

---

**Made with ❤️ for facility management professionals**
