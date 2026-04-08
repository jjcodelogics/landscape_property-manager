# Landscape Property Manager - Project Documentation

## 📋 Project Overview

**Landscape Property Manager** is a production-ready web application designed for managing landscaping operations across large facility terrains. It provides an interactive map-based interface for defining work zones, tracking maintenance tasks, and analyzing operational statistics.

The application enables facility managers and landscaping teams to:
- Define geographical zones on an interactive map (grass areas, waste collection points, maintenance zones)
- Track work completion with detailed task logging
- Schedule and monitor upcoming maintenance
- Analyze productivity through comprehensive statistics
- Manage instructions and notes for each zone

---

## 🛠️ Technology Stack

### Frontend Framework
- **Next.js 16.2.2** - React framework with App Router architecture
- **React 19.2.4** - UI component library
- **TypeScript 5** - Type-safe JavaScript

### Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **Custom CSS variables** - Dynamic theming support
- **PostCSS** - CSS processing

### Mapping & Geospatial
- **Leaflet 1.9.4** - Interactive map library
- **React-Leaflet 5.0.0** - React wrapper for Leaflet
- **Leaflet-Draw 1.0.4** - Drawing and editing tools for polygons
- **GeoJSON** - Standard format for geographical features

### Backend & Database
- **Supabase** - PostgreSQL database with built-in API
  - Row Level Security (RLS) for data protection
  - Real-time capabilities
  - RESTful API generation
- **PostgreSQL** - Relational database (via Supabase)

### Additional Libraries
- **lucide-react 1.7.0** - Icon library
- **react-markdown 10.1.0** - Markdown rendering
- **remark-gfm 4.0.1** - GitHub Flavored Markdown support
- **@supabase/supabase-js 2.102.1** - Supabase client library

### Development Tools
- **ESLint 9** - Code linting
- **Node.js ≥18.0.0** - Runtime environment

---

## 🎯 Core Functionality

### What the Application Does

The Landscape Property Manager is a **geographical task management system** that bridges physical property management with digital tracking. It solves the problem of coordinating landscaping work across large facilities by:

1. **Spatial Organization**: Divides property into manageable zones with precise geographical boundaries
2. **Work Tracking**: Records all maintenance activities with timestamps and duration
3. **Scheduling**: Tracks last work date and estimates next service date for proactive planning
4. **Documentation**: Stores zone-specific instructions, contacts, and notes in Markdown format
5. **Analytics**: Provides insights into time spent, task frequency, and zone-by-zone performance

### Primary Use Cases

- **Facility Managers**: Plan and schedule landscaping work across campus or property
- **Landscaping Crews**: View zone-specific instructions and log completed work
- **Operations Teams**: Monitor maintenance history and optimize resource allocation
- **Property Owners**: Track landscaping service quality and costs

---

## ✨ Feature Set

### 1. Interactive Map Interface
- **Technology**: Leaflet.js with OpenStreetMap tiles
- **Capabilities**:
  - Pan, zoom, and navigate across property
  - Click zones to view details
  - Color-coded zones by type (grass=green, waste=blue, maintenance=orange)
  - Tooltips showing zone titles
  - Responsive design for desktop and mobile

### 2. Zone Management System
- **Zone Types**:
  - **Grass**: Lawn areas requiring mowing
  - **Waste**: Garbage collection points
  - **Maintenance**: General maintenance areas
- **Zone Properties**:
  - **Title** (required): Primary zone identifier
  - **Name** (optional): Additional descriptive name
  - **Type**: Category classification
  - **Instructions**: Markdown-formatted task details
  - **GeoJSON Geometry**: Precise polygon boundaries
  - **Last Worked At**: Timestamp of last service
  - **Next Scheduled Work**: Estimated next maintenance date
- **Admin Interface**:
  - Draw new zones directly on map
  - Edit existing zone boundaries
  - Update zone properties
  - Delete zones (cascades to related tasks)

### 3. Task Logging System
- **Task Types**:
  - Mowing
  - Waste collection
  - General maintenance
- **Task Properties**:
  - Duration in minutes
  - Notes/observations
  - Linked to specific zone
  - Automatic timestamp
- **Quick Duration Input**: Preset buttons (5, 10, 15, 30, 45, 60 minutes)
- **Modal Interface**: Bottom sheet on mobile, centered modal on desktop

### 4. Statistics & Analytics Dashboard
- **Zone Statistics**:
  - Total time spent per zone
  - Average task duration
  - Task count per zone
- **Weekly Summary**: Total minutes worked in last 7 days
- **Recent Tasks**: List of 10 most recent activities with zone context
- **Visual Breakdown**: Per-zone performance metrics

### 5. Zone Information Sidebar
- **Zone Details Display**:
  - Title and optional name
  - Zone type badge
  - Last work date
  - Next scheduled work date
- **Markdown-Rendered Instructions**:
  - GitHub Flavored Markdown support
  - Tasks, notes, contacts formatting
  - Structured information display
- **Quick Actions**: Direct "Log Task" button

### 6. Security & Protection
- **Input Validation**:
  - Text length constraints (title: 200 chars, instructions: 2000 chars)
  - UUID validation
  - GeoJSON structure validation
  - Coordinate bounds checking
  - ISO date validation
- **Security Headers**:
  - X-Frame-Options (clickjacking prevention)
  - Content Security Policy
  - XSS protection
  - CORS configuration
- **Rate Limiting**:
  - 60 requests/minute (GET)
  - 30 requests/minute (POST/PUT)
  - IP-based throttling
- **Row Level Security**: Supabase RLS for data access control
- **Environment Variable Protection**: Type-safe secret management

### 7. Responsive Design
- **Mobile-First**: Touch-optimized controls
- **Adaptive Layouts**:
  - Bottom sheets on mobile
  - Sidebars on desktop
  - Full-screen map experience
- **Safe Area Support**: iPhone notch and Android navigation bar handling
- **Touch Gestures**: Swipe and tap interactions

---

## 🏗️ Architecture

### Application Structure

```
landscape-property-manager/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main map view (public)
│   ├── layout.tsx                # Root layout with metadata
│   ├── globals.css               # Global styles & CSS variables
│   ├── admin/
│   │   └── zones/page.tsx        # Zone editor (admin interface)
│   ├── stats/
│   │   └── page.tsx              # Statistics dashboard
│   └── api/                      # API routes
│       ├── zones/route.ts        # GET/POST zones
│       ├── zones/[id]/route.ts   # PUT/DELETE zones
│       ├── tasks/route.ts        # GET/POST tasks
│       └── stats/route.ts        # GET statistics
├── components/                   # React components
│   ├── Map.tsx                   # Public map viewer
│   ├── AdminMap.tsx              # Admin map with drawing tools
│   ├── Sidebar.tsx               # Zone details sidebar
│   ├── TaskForm.tsx              # Task logging modal
│   └── ErrorBoundary.tsx         # Error handling wrapper
├── lib/                          # Utilities & configuration
│   ├── supabase.ts               # Supabase client
│   ├── types.ts                  # TypeScript interfaces
│   ├── validation.ts             # Input validation functions
│   ├── rate-limit.ts             # Rate limiting logic
│   ├── env.ts                    # Environment variable handling
│   └── zones.ts                  # Zone utilities
├── supabase/
│   └── schema.sql                # Database schema
├── middleware.ts                 # Security middleware
└── public/                       # Static assets
```

### Data Model

**Zones Table**:
```typescript
{
  id: UUID (primary key)
  title: string (required, max 200 chars)
  name: string (optional, max 200 chars)
  type: 'grass' | 'waste' | 'maintenance'
  instructions: string (nullable, max 2000 chars)
  geojson: JSONB (max 1MB)
  last_worked_at: timestamp (nullable)
  next_scheduled_work: timestamp (nullable)
  created_at: timestamp
}
```

**Tasks Table**:
```typescript
{
  id: UUID (primary key)
  zone_id: UUID (foreign key to zones)
  task_type: 'mowing' | 'waste' | 'maintenance'
  duration_minutes: integer (1-1440)
  notes: string (nullable, max 2000 chars)
  created_at: timestamp
}
```

### API Design

- **RESTful Conventions**: Standard HTTP methods
- **JSON Communication**: All requests/responses in JSON
- **Error Handling**: Consistent error format with sanitized messages
- **Rate Limiting**: Per-endpoint throttling
- **Validation**: Comprehensive input sanitization

---

## 🔐 Security Implementation

### Authentication & Authorization
- **Row Level Security (RLS)**: Database-level access control
- **Public Read Access**: Anyone can view zones and tasks
- **Authenticated Writes**: Modifications require authentication
- **Future Enhancement**: Multi-tenant support with user ownership

### Input Validation
- **SQL Injection Prevention**: Parameterized queries via Supabase
- **XSS Prevention**: Input sanitization and CSP headers
- **Size Limits**: GeoJSON max 1MB, text field constraints
- **Type Safety**: TypeScript + runtime validation

### Rate Limiting (In-Memory)
⚠️ **Production Note**: Current implementation uses in-memory storage, suitable for development. Production deployments should use:
- Redis (Upstash, Vercel KV)
- Cloudflare rate limiting
- Database-based throttling

---

## 🚀 Deployment

### Current Deployment Target
- **Platform**: Vercel (optimized for Next.js)
- **Database**: Supabase (hosted PostgreSQL)
- **CDN**: Automatic via Vercel Edge Network

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

### Build & Runtime
- **Build Command**: `npm run build`
- **Output**: Static + Server-Side Rendered pages
- **Runtime**: Node.js ≥18.0.0
- **Serverless Functions**: API routes on Vercel

---

## 📊 Current Limitations & Constraints

### Technical Limitations
1. **In-Memory Rate Limiting**: Not suitable for distributed serverless
2. **Single Tenant**: No multi-organization support
3. **No Real-Time Updates**: Changes require page refresh
4. **No User Authentication UI**: RLS policies exist but no login flow
5. **No Offline Support**: Requires active internet connection
6. **No Image Uploads**: No photo documentation of completed work
7. **No Mobile App**: Web-only, no native iOS/Android apps

### Scalability Considerations
- **GeoJSON Size**: 1MB limit per zone may restrict very large properties
- **In-Memory Store**: Rate limiting won't work across multiple instances
- **Database Queries**: No pagination on zones/tasks (may slow with 1000+ records)

### User Experience Gaps
- **No Undo/Redo**: Zone edits are immediate with no rollback
- **No Bulk Operations**: Edit zones one at a time
- **Limited Search**: No text search for zones or tasks
- **No Notifications**: No alerts for upcoming maintenance
- **Basic Analytics**: No charts, graphs, or trend analysis

---

## 🎯 Potential Improvements & Next Level Features

### High-Priority Enhancements

#### 1. User Authentication & Multi-Tenancy
- **Supabase Auth Integration**: Email/password, OAuth (Google, GitHub)
- **Organization/Property Management**: Multiple properties per account
- **Role-Based Access Control**: Admin, Manager, Worker roles
- **User Profiles**: Track who logged each task

#### 2. Real-Time Collaboration
- **Supabase Realtime**: Live updates when others edit zones
- **Presence Indicators**: See who's viewing/editing
- **Conflict Resolution**: Handle simultaneous edits

#### 3. Advanced Analytics
- **Charts & Graphs**: Time-series visualization (Chart.js, Recharts)
- **Cost Tracking**: Budget vs. actual spending
- **Efficiency Metrics**: Tasks per hour, cost per zone
- **Predictive Analytics**: ML-based scheduling recommendations
- **Export Reports**: PDF/Excel generation

#### 4. Mobile App
- **React Native**: Shared codebase with web
- **Offline Mode**: Local storage with sync
- **GPS Integration**: Auto-detect zone entry/exit
- **Camera Integration**: Photo documentation
- **Push Notifications**: Reminders and alerts

#### 5. Enhanced Scheduling
- **Calendar View**: Visual schedule with drag-and-drop
- **Recurring Tasks**: Auto-schedule daily/weekly/monthly
- **Weather Integration**: Adjust schedules based on forecast
- **Staff Assignment**: Assign zones to specific crew members
- **Route Optimization**: Efficient zone visit order

#### 6. Media & Documentation
- **Photo Uploads**: Before/after task photos
- **File Attachments**: PDFs, documents per zone
- **Video Instructions**: Embedded training videos
- **Equipment Tracking**: Tools and supplies inventory

#### 7. Integrations
- **Google Calendar**: Sync scheduled work
- **Accounting Software**: QuickBooks, Xero integration
- **Weather APIs**: OpenWeatherMap, Weather.gov
- **SMS Notifications**: Twilio integration
- **Email Notifications**: Sendgrid, Resend.com

#### 8. Advanced Mapping
- **Satellite Imagery**: Toggle basemap layers
- **Custom Markers**: Points of interest, equipment storage
- **Measurement Tools**: Area calculation, distance measurement
- **Import/Export**: KML, Shapefile support
- **3D Terrain**: Elevation visualization

### Medium-Priority Improvements

- **Search & Filters**: Full-text search across zones and tasks
- **Undo/Redo**: Edit history with rollback
- **Bulk Operations**: Select and edit multiple zones
- **Task Templates**: Pre-defined task types with defaults
- **Inventory Management**: Track supplies and equipment
- **Time Clock**: Clock in/out for crew members
- **Invoice Generation**: Automated billing from task logs
- **Client Portal**: Property owners view reports
- **Dark Mode**: Theme toggle
- **Accessibility**: WCAG 2.1 AA compliance
- **Internationalization**: Multi-language support

### Technical Improvements

- **Redis Rate Limiting**: Production-ready throttling
- **Database Pagination**: Efficient large dataset handling
- **Caching Layer**: Redis/CDN for zone geometry
- **GraphQL API**: More efficient data fetching (optional)
- **WebSockets**: Real-time updates
- **Service Worker**: PWA with offline capabilities
- **Automated Testing**: Jest, Playwright, Cypress
- **CI/CD Pipeline**: Automated deployments
- **Monitoring**: Sentry, LogRocket error tracking
- **Performance Optimization**: Lighthouse score improvements

---

## 💡 Strategic Recommendations

### Short-Term (1-3 months)
1. Implement user authentication (Supabase Auth)
2. Add Redis-based rate limiting (Upstash)
3. Create basic analytics charts
4. Add photo upload capability
5. Implement task search and filtering

### Medium-Term (3-6 months)
1. Build mobile app (React Native)
2. Add real-time collaboration
3. Implement scheduling calendar
4. Create staff management system
5. Add weather integration

### Long-Term (6-12 months)
1. Multi-tenant architecture with organizations
2. Advanced ML-based scheduling
3. Custom reporting and dashboards
4. Third-party integrations (accounting, calendar)
5. White-label solution for commercial use

---

## 📈 Success Metrics to Track

### User Engagement
- Daily/monthly active users
- Average session duration
- Zones created per user
- Tasks logged per day

### Performance
- Page load time (LCP, FID, CLS)
- API response times
- Database query performance
- Error rates

### Business Value
- Time saved vs. manual tracking
- Cost reduction in landscaping operations
- Maintenance schedule adherence
- Customer satisfaction scores

---

## 🎓 Learning & Development Opportunities

This project provides excellent opportunities to learn:

- **Geospatial Development**: GeoJSON, Leaflet, mapping libraries
- **Full-Stack TypeScript**: End-to-end type safety
- **Modern React Patterns**: Server components, client components
- **Database Design**: PostgreSQL, RLS policies
- **API Development**: RESTful design, validation, error handling
- **Security Best Practices**: CSP, rate limiting, input sanitization
- **Serverless Architecture**: Vercel, edge functions
- **Real-Time Systems**: Supabase realtime subscriptions
- **Mobile Development**: React Native (future)
- **DevOps**: CI/CD, monitoring, deployment

---

## 📚 Resources for Enhancement

### Documentation
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Leaflet Tutorials](https://leafletjs.com/examples.html)
- [PostgreSQL + PostGIS](https://postgis.net/)

### Similar Projects for Inspiration
- **FieldMaps** (Esri): Enterprise field mapping
- **Crew Control**: Field service management
- **LandscapeHub**: Commercial landscaping software
- **Jobber**: Service business management

---

## 🤝 Contributing & Collaboration

### How AI Can Help Improve This Project

When discussing improvements with AI assistants, focus on:

1. **Specific Feature Requests**: "Add a calendar view for scheduling tasks"
2. **Architecture Questions**: "How to implement real-time updates with Supabase?"
3. **Performance Optimization**: "Optimize map rendering for 500+ zones"
4. **Security Review**: "Are there SQL injection vulnerabilities?"
5. **Code Refactoring**: "Extract validation logic into reusable hooks"
6. **Testing Strategy**: "Create integration tests for zone API"
7. **Database Schema**: "Design multi-tenant tables with RLS"
8. **UI/UX Improvements**: "Make the task form more intuitive"

### Questions to Ask AI

- "How can we add offline support with service workers?"
- "What's the best way to implement role-based access control?"
- "How do we optimize GeoJSON rendering for mobile devices?"
- "What's the recommended approach for photo uploads to Supabase Storage?"
- "How can we implement predictive maintenance scheduling?"
- "What metrics should we track for landscaping operations?"
- "How to structure a multi-tenant database schema?"

---

## 📄 License & Usage

This is a private project currently used for property management operations. Future considerations for open-source release or commercial licensing are under evaluation.

---

**Last Updated**: April 7, 2026  
**Version**: 0.1.0  
**Current Stage**: Production MVP with room for growth
