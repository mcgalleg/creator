# Creator Analytics

AI-powered TikTok analytics dashboard that lets content creators understand their performance through natural language queries.

## Features

- **Natural Language Analytics** - Ask questions about your TikTok data in plain English
- **AI-Generated Visualizations** - Claude AI generates interactive charts and metrics
- **Canvas Workspace** - Pin visualizations to a persistent canvas with drag-and-drop layout
- **Dynamic Dashboard** - Customizable widget-based dashboard with 20+ widget types
- **Multi-Account Support** - Connect and analyze multiple TikTok accounts
- **Smart Comment Sync** - Flexible sync options (by selection, top performers, date range, or budget)
- **Persistent Async State** - Long-running operations (syncs, connections) survive page refreshes
- **Subscription Tiers** - Feature gating with Free, Pro, and Enterprise tiers
- **Credit System** - Pay-as-you-go pricing for data syncs
- **Keyboard Shortcuts** - Command palette (Cmd+K) and customizable shortcuts

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **AI**: Anthropic Claude (claude-sonnet-4-20250514) with tool calling
- **Database**: PostgreSQL (Neon serverless) with Drizzle ORM
- **Authentication**: Clerk
- **Data Source**: Apify TikTok Scraper
- **Styling**: Tailwind CSS v4, Shadcn/ui, Radix UI
- **Charts**: Recharts
- **Canvas**: React Flow for node-based visualization workspace
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
│   │   ├── accounts/      # TikTok account management & sync
│   │   ├── chat/          # AI analytics chat
│   │   ├── credits/       # Credit system & history
│   │   ├── canvases/      # Canvas persistence
│   │   ├── dashboard/     # Dashboard data APIs
│   │   ├── features/      # Feature flags API
│   │   ├── mcp/           # MCP server endpoint
│   │   └── auth/webhook/  # Clerk webhook
│   ├── dashboard/         # Protected dashboard pages
│   │   ├── accounts/      # Account management page
│   │   └── settings/      # User settings page
│   └── page.tsx           # Public landing page
├── components/
│   ├── analytics/         # Chart and visualization components
│   ├── backgrounds/       # Animated background effects
│   ├── canvas/            # Canvas workspace (React Flow)
│   ├── chat/              # Chat interface
│   ├── dashboard/         # Dashboard shell, widgets, and navigation
│   ├── settings/          # Settings page components
│   ├── layout/            # Layout primitives (Row, Column, Grid)
│   └── ui/                # Shadcn/ui components
├── contexts/              # React contexts (features, canvas)
├── hooks/                 # Custom React hooks
│   ├── use-accounts.ts    # Account management with persistent sync state
│   ├── use-analytics-chat.ts
│   ├── use-breakpoint.ts
│   ├── use-canvas-state.ts
│   ├── use-canvases.ts
│   ├── use-dashboard-data.ts
│   ├── use-dashboard-layout.ts
│   ├── use-features.ts
│   ├── use-keyboard-shortcuts.ts
├── lib/
│   ├── db/                # Drizzle ORM setup and schemas
│   ├── services/          # Business logic (sync, credits, features, users)
│   ├── widgets/           # Widget registry and implementations
│   ├── persistent-async-state.ts  # localStorage persistence utilities
│   ├── catalog.ts         # AI component catalog
│   ├── auth.ts            # Authentication utilities
│   └── utils.ts           # General utilities
└── public/                # Static assets
```

## Architecture

### Data Flow

1. **Authentication**: Clerk handles user sign-in; webhook creates user record with signup credits
2. **Account Connection**: User enters TikTok username; Apify validates and scrapes profile
3. **Data Sync**: Background jobs fetch posts/comments; credits deducted on completion
4. **Analytics Chat**: User asks questions; Claude AI queries data and generates visualizations
5. **Dashboard**: Pinned charts persist across sessions; real-time updates via hooks

### Persistent Async State

Long-running operations persist to localStorage and survive page refreshes:

- **Account Connection**: Shows "Connecting @username..." after refresh until complete
- **Account Sync**: Resumes polling for sync status after refresh
- **Comment Sync**: Shows sync-in-progress banner in dialog

State expires after configurable timeouts (2 minutes for connections, 15 minutes for syncs).

### Database Schema

- **users** - User profiles with subscription tier (free/basic/pro)
- **tiktok_accounts** - Connected TikTok accounts
- **posts** - Synced TikTok videos with engagement metrics
- **comments** - Video comments (optional sync)
- **account_metrics_history** - Time-series engagement snapshots
- **credit_transactions** - Audit log for credit changes
- **sync_jobs** - Background sync job tracking with comment sync config
- **canvases** - Persistent canvas workspaces with React Flow state
- **canvas_annotations** - Canvas sticky notes and text annotations
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

The dashboard includes 23 customizable widgets organized by category:

**KPI Widgets**
- Followers, Total Plays, Engagement Rate
- Total Likes, Total Saves, Total Shares
- Average Views, Content Velocity, Overview Metrics

**Chart Widgets**
- Engagement Trend, Engagement Breakdown
- Posting Frequency, Best Posting Times
- Growth Chart, Duration vs Performance

**Content Widgets**
- Top Performing Videos, Recent Posts
- Viral Posts, Underperforming Content

**Comment Widgets**
- Recent Comments, Top Commenters
- Comment Sentiment, Comment Activity

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

### Account Management

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/accounts` | List connected accounts |
| POST | `/api/accounts` | Connect new TikTok account |
| DELETE | `/api/accounts/[id]` | Disconnect account |
| POST | `/api/accounts/[id]/sync` | Trigger data sync |
| GET | `/api/accounts/[id]/sync` | Get sync job status |
| POST | `/api/accounts/[id]/sync/comments` | Trigger comment sync |

### Dashboard Data

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/dashboard/overview` | Account overview metrics |
| GET | `/api/dashboard/engagement` | Engagement trend data |
| GET | `/api/dashboard/breakdown` | Engagement breakdown by type |
| GET | `/api/dashboard/top-content` | Top performing posts |
| GET | `/api/dashboard/recent-posts` | Recent posts list |
| GET | `/api/dashboard/posting-times` | Best posting times analysis |
| GET | `/api/dashboard/growth` | Follower growth data |
| GET | `/api/dashboard/comments` | Recent comments |
| GET | `/api/dashboard/comments/top-commenters` | Most active commenters |
| GET | `/api/dashboard/comments/sentiment` | Comment sentiment analysis |
| GET | `/api/dashboard/comments/activity` | Comment activity over time |
| GET/PUT | `/api/dashboard/layouts` | Dashboard layout management |

### Other APIs

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/chat` | AI analytics chat |
| GET | `/api/credits` | Get credit balance |
| GET | `/api/credits/history` | Credit transaction history |
| GET | `/api/features` | Get feature flags |
| GET/POST | `/api/canvases` | Canvas CRUD operations |
| GET/PUT/DELETE | `/api/canvases/[id]` | Single canvas operations |
| * | `/api/mcp/[transport]` | MCP server endpoint |

## Key Components

### Analytics Visualizations
- `MetricCard` - Single KPI display with trend indicator
- `MetricGroup` - Grouped metrics display
- `BarChart`, `LineChart`, `AreaChart`, `PieChart` - Recharts wrappers
- `DataTable` - Structured data display with sorting
- `VideoCard`, `TopVideosGrid` - TikTok video previews
- `EngagementTimeline` - Engagement trends over time

### Dashboard Components
- `DynamicDashboard` - Widget-based customizable dashboard
- `DashboardGrid` - Responsive grid layout with react-grid-layout
- `DashboardWidget` - Individual widget container
- `WidgetPicker` - Widget selection dialog
- `ViewTabs` - Dashboard/Canvas/Chat view switcher

### Chat Interface
- `ChatContainer` - Main AI chat UI
- `ChatPanel` - Resizable chat sidebar
- `MessageList` - Chat message display
- `AnalyticsRenderer` - Renders AI-generated component trees
- `VisualizationReference` - Referenced chart in chat

### Canvas Components
- `AnalyticsCanvas` - React Flow canvas workspace
- `CanvasToolbar` - Canvas editing tools
- `StickyNoteNode`, `TextNoteNode` - Annotation nodes
- `AnalyticsCardNode` - Pinned visualization node

### Account Management
- `AccountConnectionForm` - TikTok username input with persistent state
- `AccountList` - Connected accounts display
- `CommentSyncDialog` - Comment sync configuration
- `SyncStatus` - Sync progress indicator

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Open command palette |
| `Cmd+/` | Toggle chat panel |
| `Cmd+1` | Switch to Dashboard view |
| `Cmd+2` | Switch to Canvas view |
| `Cmd+3` | Switch to Chat view |
| `?` | Show keyboard shortcuts help |

## Deployment

Deploy on [Vercel](https://vercel.com) for optimal Next.js performance:

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy

Ensure the Clerk webhook endpoint (`/api/auth/webhook`) is configured to receive user creation events.

## License

Private - All rights reserved
