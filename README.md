# Creator Analytics

AI-powered TikTok analytics dashboard that lets content creators understand their performance through natural language queries.

## Features

- **Natural Language Analytics** - Ask questions about your TikTok data in plain English
- **AI-Generated Visualizations** - Claude AI generates interactive charts and metrics
- **Canvas Workspace** - Pin visualizations to a persistent canvas with drag-and-drop layout
- **Dynamic Dashboard** - Customizable widget-based dashboard with 20+ widget types
- **Multi-Account Support** - Connect and analyze multiple TikTok accounts
- **Smart Comment Sync** - Flexible sync options (by selection, top performers, date range, or budget)
- **Subscription Tiers** - Feature gating with Free, Pro, and Enterprise tiers
- **Credit System** - Pay-as-you-go pricing for data syncs

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **AI**: Anthropic Claude (claude-sonnet-4-20250514) with tool calling
- **Database**: PostgreSQL (Neon serverless) with Drizzle ORM
- **Authentication**: Clerk
- **Data Source**: Apify TikTok Scraper
- **Styling**: Tailwind CSS v4, Shadcn/ui, Radix UI
- **Charts**: Recharts
- **UI Generation**: @json-render for validated component trees

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm
- PostgreSQL database (Neon recommended)
- Clerk account
- Anthropic API key
- Apify API token

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd creator

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
npx drizzle-kit push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Environment Variables

```env
# Authentication (Clerk)
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@host/dbname

# AI (Anthropic)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Data Scraping (Apify)
APIFY_API_TOKEN=apify_...
```

## Project Structure

```
creator/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── accounts/      # TikTok account management
│   │   ├── chat/          # AI analytics chat
│   │   ├── credits/       # Credit system
│   │   ├── canvases/      # Canvas persistence
│   │   ├── dashboard/     # Dashboard data APIs
│   │   ├── features/      # Feature flags API
│   │   ├── pinned/        # Dashboard pinned components
│   │   └── auth/webhook/  # Clerk webhook
│   ├── dashboard/         # Protected dashboard pages
│   └── page.tsx           # Public landing page
├── components/
│   ├── analytics/         # Chart and visualization components
│   ├── canvas/            # Canvas workspace (React Flow)
│   ├── chat/              # Chat interface
│   ├── dashboard/         # Dashboard shell and navigation
│   ├── settings/          # Settings page components
│   ├── layout/            # Layout primitives
│   └── ui/                # Shadcn/ui components
├── contexts/              # React contexts (features, canvas)
├── lib/
│   ├── db/                # Drizzle ORM setup and schemas
│   ├── services/          # Business logic (sync, credits, features)
│   ├── widgets/           # Widget registry and implementations
│   └── catalog.ts         # AI component catalog
└── hooks/                 # Custom React hooks
```

## Architecture

### Data Flow

1. **Authentication**: Clerk handles user sign-in; webhook creates user record with signup credits
2. **Account Connection**: User enters TikTok username; Apify validates and scrapes profile
3. **Data Sync**: Background jobs fetch posts/comments; credits deducted on completion
4. **Analytics Chat**: User asks questions; Claude AI queries data and generates visualizations
5. **Dashboard**: Pinned charts persist across sessions; real-time updates via hooks

### Database Schema

- **users** - User profiles with subscription tier (free/pro/enterprise)
- **tiktok_accounts** - Connected TikTok accounts
- **posts** - Synced TikTok videos with engagement metrics
- **comments** - Video comments (optional sync)
- **account_metrics_history** - Time-series engagement snapshots
- **credit_transactions** - Audit log for credit changes
- **sync_jobs** - Background sync job tracking with comment sync config
- **pinned_components** - User dashboard customizations
- **canvases** - Persistent canvas workspaces with React Flow state
- **dashboard_layouts** - Custom dashboard widget layouts
- **feature_flags** - System-wide feature configuration
- **user_feature_overrides** - Per-user feature access overrides

### Subscription Tiers

| Tier | Features |
|------|----------|
| **Free** | Dashboard with default widgets |
| **Pro** | Dashboard + Canvas + Analytics Assistant |
| **Enterprise** | All features + priority support |

### Credit System

Pay-per-sync model (1 credit = $0.01):

| Operation | Cost |
|-----------|------|
| Profile sync | 25 credits |
| Posts (per 50) | 25 credits |
| Comments (per 100) | 15 credits |
| Signup bonus | 100 credits free |

### Widget Library

The dashboard includes 20+ customizable widgets:

**KPI Widgets**: Followers, Total Plays, Engagement Rate, Likes, Saves, Shares, Average Views

**Chart Widgets**: Engagement Trends, Engagement Breakdown, Posting Frequency, Best Posting Times, Growth Chart, Duration vs Performance

**Content Widgets**: Top Performing Videos, Recent Posts

**Comment Widgets**: Recent Comments, Top Commenters, Comment Sentiment, Comment Activity

### Comment Sync Options

Flexible comment syncing strategies:

- **By Selection** - Manually pick specific posts to sync comments
- **Top Performers** - Auto-sync comments from top N posts by engagement
- **Date Range** - Sync posts within a date range with max comments limit
- **Budget Mode** - Set credit budget, system optimizes which posts to sync

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Database operations
npx drizzle-kit push     # Push schema to database
npx drizzle-kit studio   # Open Drizzle Studio
```

### Testing with Auth Bypass

For automated testing without Clerk authentication (development only):

```bash
# Add to .env.local (NEVER use in production)
BYPASS_AUTH=true

# Seed test user
npx tsx scripts/seed-test-user.ts
```

This creates a test user (`test_user_123`) with 1000 credits and pro tier access.

**Security Note**: The auth bypass includes a production safeguard that throws an error if `BYPASS_AUTH=true` is detected in production environment.

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/accounts` | List connected accounts |
| POST | `/api/accounts` | Connect new TikTok account |
| DELETE | `/api/accounts/[id]` | Disconnect account |
| POST | `/api/accounts/[id]/sync` | Trigger data sync |
| POST | `/api/chat` | AI analytics chat |
| GET | `/api/credits` | Get credit balance |
| GET/POST/DELETE | `/api/pinned` | Manage pinned charts |

## Key Components

### Analytics Visualizations
- `MetricCard` - Single KPI display
- `BarChart`, `LineChart`, `AreaChart`, `PieChart` - Recharts wrappers
- `DataTable` - Structured data display
- `VideoCard`, `TopVideosGrid` - TikTok video previews
- `EngagementTimeline` - Engagement trends over time

### Chat Interface
- `ChatContainer` - Main AI chat UI
- `AnalyticsRenderer` - Renders AI-generated component trees

## Deployment

Deploy on [Vercel](https://vercel.com) for optimal Next.js performance:

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy

Ensure the Clerk webhook endpoint (`/api/auth/webhook`) is configured to receive user creation events.

## License

Private - All rights reserved
