# Astriq — AI-Powered TikTok Analytics

Astriq is an AI-powered TikTok analytics platform that lets content creators understand their performance through natural language queries, AI-generated visualizations, and a freeform canvas workspace.

## Features

- **AI Chat Copilot** — Ask questions about your TikTok data in plain English; Claude generates interactive charts, metrics, and insights
- **Canvas Workspace** — Freeform Excalidraw workspace for sketching notes, shapes, and visual strategy planning
- **Multi-Account Support** — Connect and analyze multiple TikTok accounts (1–50 depending on tier)
- **Smart Comment Sync** — Sync by selection, top performers, date range, or budget
- **MCP Server** — Connect Claude Desktop, ChatGPT, or Claude Code as external AI clients
- **17 Color Themes** — Full theming with light/dark mode support
- **Keyboard Shortcuts** — Command palette (`Cmd+K`) and customizable shortcuts

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **AI**: Anthropic Claude (claude-sonnet-4-20250514) with tool calling
- **Database**: PostgreSQL (Neon serverless) with Drizzle ORM
- **Authentication**: Clerk
- **Payments**: Polar (subscriptions, credit packs, AI token packs)
- **Data Source**: Apify TikTok Scraper
- **Styling**: Tailwind CSS v4, Shadcn/ui, Radix UI, Lucide React icons
- **Charts**: Recharts
- **Canvas**: Excalidraw
- **Video**: Remotion
- **UI Generation**: @json-render for validated component trees

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL database (Neon recommended)
- Clerk account
- Anthropic API key
- Apify API token
- Polar account (for subscriptions and payments)

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

# Set up Polar products (subscriptions, credit packs, webhook)
npx tsx scripts/setup-polar.ts

# Set up AI token packs in Polar
npx tsx scripts/setup-ai-token-packs.ts

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

# AI (Vercel AI Gateway format: "provider/model")
AI_MODEL=openai/gpt-5.3-codex
OPENAI_API_KEY=sk-...              # or ANTHROPIC_API_KEY for Anthropic models

# Data Scraping (Apify)
APIFY_API_TOKEN=apify_...

# Payments (Polar) — populated by setup scripts
POLAR_ACCESS_TOKEN=pat_...
POLAR_WEBHOOK_SECRET=...
POLAR_WEBHOOK_URL=https://<your-url>
POLAR_SERVER=sandbox           # or "production"
POLAR_AI_METER_ID=...
POLAR_SYNC_METER_ID=...
NEXT_PUBLIC_POLAR_PRODUCT_BASIC=...
NEXT_PUBLIC_POLAR_PRODUCT_PRO=...
NEXT_PUBLIC_POLAR_PRODUCT_AGENCY=...
NEXT_PUBLIC_POLAR_PRODUCT_MCP=...
NEXT_PUBLIC_POLAR_PRODUCT_FREE=...
NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_BASIC=...
NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_PRO=...
NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_AGENCY=...
NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_STARTER=...
NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_VALUE=...
NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_POWER=...
NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_BULK=...
NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_STARTER=...
NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_VALUE=...
NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_POWER=...
NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_BULK=...
```

## Pricing

### Subscription Tiers

| Tier | Monthly | Annual | AI Tokens/mo | Sync Credits/mo | Accounts |
|------|---------|--------|-------------|----------------|----------|
| **Free** | $0 | $0 | 100K | 50 | 1 |
| **Creator** | $14.99 | $11.99/mo | 1M | 500 | 5 |
| **Pro** | $29.99 | $23.99/mo | 3M | 1,500 | 15 |
| **Agency** | $59.99 | $47.99/mo | 10M | 4,000 | 50 |
| **MCP Apps** | Pay as you go | — | — | — | 10 |

Data is retained while subscribed. 60 days after cancellation, data is permanently deleted.

### Sync Credit Packs

One-time purchases that never expire. Used for syncing posts and comments.

| Pack | Credits | Price | Per Credit |
|------|---------|-------|------------|
| Starter | 250 | $4.99 | $0.020 |
| Value | 600 | $9.99 | $0.017 |
| Power | 1,500 | $19.99 | $0.013 |
| Bulk | 3,000 | $34.99 | $0.012 |

### AI Token Packs

One-time purchases that never expire. Used for AI chat queries.

| Pack | Tokens | Price | Per 1K Tokens |
|------|--------|-------|---------------|
| Starter | 250K | $2.99 | $0.012 |
| Value | 1M | $8.99 | $0.009 |
| Power | 3M | $19.99 | $0.007 |
| Bulk | 10M | $49.99 | $0.005 |

### Credit Costs

| Operation | Cost |
|-----------|------|
| Post sync | 1 credit per post |
| Comment sync | 0.15 credits per comment |
| AI chat | ~1 credit per 5K tokens |

## Project Structure

```
creator/
├── app/
│   ├── api/
│   │   ├── accounts/          # Account CRUD & sync
│   │   ├── analytics/         # Analytics transport
│   │   ├── auth/webhook/      # Clerk webhook
│   │   ├── chat/              # AI chat (streaming)
│   │   ├── checkout/          # Polar checkout
│   │   ├── credits/           # Credit balance & history
│   │   ├── cron/              # Scheduled jobs (data purge)
│   │   ├── dashboard/         # Dashboard data APIs
│   │   ├── drawings/          # Canvas persistence
│   │   ├── features/          # Feature flags
│   │   ├── image/             # Image proxy
│   │   ├── mcp-app/           # MCP server endpoint
│   │   ├── portal/            # Billing portal
│   │   ├── test/              # Testing APIs (dev only)
│   │   ├── user/              # User settings & subscription
│   │   └── webhooks/          # Polar & Apify webhooks
│   ├── dashboard/             # Protected dashboard pages
│   │   ├── accounts/          # Account management
│   │   ├── mcp/               # MCP tier dashboard
│   │   └── settings/          # User settings
│   ├── docs/                  # Help & documentation pages
│   ├── onboarding/            # Account connection flow
│   ├── pricing/               # Pricing page
│   ├── privacy/               # Privacy policy
│   ├── terms/                 # Terms of service
│   └── page.tsx               # Landing page
├── components/
│   ├── analytics/             # Chart & visualization components
│   ├── backgrounds/           # Animated backgrounds (PixelBlast)
│   ├── chat/                  # Chat interface
│   ├── dashboard/             # Dashboard shell, navigation
│   │   └── accounts/          # Account management UI
│   ├── excalidraw/            # Canvas drawing components
│   ├── landing/               # Landing page sections
│   ├── onboarding/            # Onboarding flow
│   ├── remotion/              # Video player (Remotion)
│   ├── settings/              # Settings page components
│   └── ui/                    # Shadcn/ui components
├── contexts/                  # React contexts (features, sync, theme)
├── drizzle/                   # Database migrations
├── e2e/                       # Playwright tests
├── hooks/                     # Custom React hooks
├── lib/
│   ├── db/schema/             # Drizzle ORM schemas
│   ├── mcp-app/               # MCP server (tools, auth, data)
│   ├── services/              # Business logic
│   │   ├── credit-service.ts  # Credit holds, deductions, transactions
│   │   ├── feature-service.ts # Tier-based feature gating
│   │   ├── subscription-service.ts
│   │   ├── sync-service.ts    # Apify integration & sync logic
│   │   └── user-service.ts    # User provisioning
│   ├── auth.ts                # Clerk auth + bypass mode
│   ├── credits.ts             # Credit rate constants
│   ├── polar.ts               # Polar API (meters, billing)
│   ├── subscriptions.ts       # Tier config, credit packs, AI token packs
│   └── transaction-utils.ts   # Transaction display helpers
├── scripts/
│   ├── setup-polar.ts         # Create Polar subscriptions & credit packs
│   ├── setup-ai-token-packs.ts # Create Polar AI token packs
│   ├── seed-test-user.ts      # Seed single test user
│   └── seed-test-users.ts     # Seed multiple test users
└── public/                    # Static assets
```

## Architecture

### Data Flow

1. **Authentication** — Clerk handles sign-in; webhook creates user record with signup credits
2. **Account Connection** — User enters TikTok username; Apify validates and scrapes profile
3. **Data Sync** — Background jobs fetch posts/comments; sync credits deducted on completion
4. **Analytics Chat** — User asks questions; Claude queries data and generates visualizations
5. **Dashboard** — Account management, data overview, and settings

### Subscription & Billing

Polar handles all subscription and payment processing:

- **Meters** — Two Polar meters track usage: `ai-tokens` and `sync-credits`
- **Subscriptions** — Monthly/annual plans grant meter credits via Polar benefits
- **Credit Packs** — One-time purchases with `rollover: true` benefits (never expire)
- **AI Token Packs** — Same architecture as credit packs, attached to the AI meter
- **Webhooks** — `onOrderPaid` handles both subscription renewals and one-time pack purchases
- **Balance Sync** — Local DB caches meter balances; Polar is the source of truth

### Database Schema

| Table | Description |
|-------|-------------|
| `users` | User profiles with subscription tier, credit balance, onboarding status |
| `tiktok_accounts` | Connected TikTok accounts with profile data |
| `posts` | Synced TikTok videos with engagement metrics |
| `comments` | Video comments with sentiment analysis |
| `sync_jobs` | Background sync job tracking |
| `credit_transactions` | Audit log for all credit changes |
| `drawings` | Excalidraw canvas state |
| `feature_flags` | System-wide feature configuration |
| `user_feature_overrides` | Per-user feature access overrides |

### MCP Server

The MCP (Model Context Protocol) server at `/api/mcp-app` exposes two tools:

- `describe_tables` — Returns database schema for the user's connected accounts
- `query_data` — Executes read-only SQL queries scoped to the user's data

This allows external AI clients (Claude Desktop, ChatGPT, Claude Code) to query TikTok analytics directly.

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
| GET | `/api/accounts/[id]/refresh-profile` | Refresh profile metadata |
| GET | `/api/accounts/[id]/stats` | Get account stats |

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
| GET | `/api/dashboard/duration-performance` | Duration vs engagement |

### Other APIs

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/chat` | AI analytics chat (streaming) |
| GET | `/api/credits` | Credit balance & pricing |
| GET | `/api/credits/history` | Credit transaction history |
| GET | `/api/checkout` | Polar checkout redirect |
| GET | `/api/portal` | Polar billing portal |
| GET | `/api/features` | Feature flags per tier |
| GET/POST | `/api/drawings` | Canvas CRUD |
| GET/PUT | `/api/user/subscription` | Subscription management |
| POST | `/api/user/subscription/cancel` | Cancel subscription |

### Webhooks

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/webhook` | Clerk user creation |
| POST | `/api/webhooks/polar` | Polar subscription & order events |
| POST | `/api/webhooks/apify` | Apify sync completion |

## Comment Sync Options

- **By Selection** — Manually pick specific posts to sync comments
- **Top Performers** — Auto-sync comments from top N posts by engagement
- **Date Range** — Sync posts within a date range with max comments limit
- **Budget Mode** — Set credit budget, system optimizes which posts to sync

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Open command palette |
| `Cmd+/` | Toggle chat panel |
| `Cmd+1` | Switch to Dashboard view |
| `Cmd+2` | Switch to Canvas view |
| `Cmd+3` | Switch to Chat view |
| `?` | Show keyboard shortcuts help |

## Development

```bash
npm run dev       # Start development server (port 3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint

# Database
npx drizzle-kit push     # Push schema to database
npx drizzle-kit studio   # Open Drizzle Studio

# Polar setup
npx tsx scripts/setup-polar.ts           # Subscriptions & sync credit packs
npx tsx scripts/setup-ai-token-packs.ts  # AI token packs
```

### Testing with Auth Bypass

For automated testing without Clerk authentication (development only):

```bash
# Add to .env.local (NEVER use in production)
BYPASS_AUTH=true

# Seed test users
npx tsx scripts/seed-test-user.ts    # Single test user (1000 credits, pro tier)
npx tsx scripts/seed-test-users.ts   # Multiple test users (api, ui, edge, default)
```

**How it works:**
- `auth()` returns `{ userId: "test_user_123" }` instead of calling Clerk
- Middleware skips Clerk protection
- Custom test user ID via `X-Test-User-Id` header for multi-user isolation
- Production safeguard throws if `BYPASS_AUTH=true` in production

**Test-only API routes** (guarded by `BYPASS_AUTH`):
- `GET /api/test/state` — Inspect DB state
- `POST /api/test/reset-credits` — Reset credit balance
- `GET/POST /api/test/subscription` — Manage test subscription

## Deployment

Deploy on [Vercel](https://vercel.com) for optimal Next.js performance:

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy

**Required webhook endpoints:**
- Clerk: `/api/auth/webhook` (user creation events)
- Polar: `/api/webhooks/polar` (subscription and order events)
- Apify: `/api/webhooks/apify` (sync completion)

**Cron jobs** (configured in `vercel.json`):
- `GET /api/cron/purge-data` — Daily at 6 AM UTC, purges data for cancelled users after 60 days

## License

Private — All rights reserved
