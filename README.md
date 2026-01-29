# Creator Analytics

AI-powered TikTok analytics dashboard that lets content creators understand their performance through natural language queries.

## Features

- **Natural Language Analytics** - Ask questions about your TikTok data in plain English
- **AI-Generated Visualizations** - Claude AI generates interactive charts and metrics
- **Multi-Account Support** - Connect and analyze multiple TikTok accounts
- **Dashboard Customization** - Pin your favorite charts to a personalized dashboard
- **Real-time Sync** - Pull latest posts, comments, and engagement metrics
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
│   │   ├── pinned/        # Dashboard pinned components
│   │   └── auth/webhook/  # Clerk webhook
│   ├── dashboard/         # Protected dashboard pages
│   └── page.tsx           # Public landing page
├── components/
│   ├── analytics/         # Chart and visualization components
│   ├── chat/              # Chat interface
│   ├── dashboard/         # Dashboard shell and navigation
│   ├── settings/          # Settings page components
│   ├── layout/            # Layout primitives
│   └── ui/                # Shadcn/ui components
├── lib/
│   ├── db/                # Drizzle ORM setup and schemas
│   ├── services/          # Business logic (sync, credits, users)
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

- **users** - User profiles synced from Clerk
- **tiktok_accounts** - Connected TikTok accounts
- **posts** - Synced TikTok videos with engagement metrics
- **comments** - Video comments (optional sync)
- **account_metrics_history** - Time-series engagement snapshots
- **credit_transactions** - Audit log for credit changes
- **sync_jobs** - Background sync job tracking
- **pinned_components** - User dashboard customizations

### Credit System

Pay-per-sync model (1 credit = $0.01):

| Operation | Cost |
|-----------|------|
| Profile sync | 25 credits |
| Posts (per 50) | 25 credits |
| Comments (per 100) | 15 credits |
| Signup bonus | 100 credits free |

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
