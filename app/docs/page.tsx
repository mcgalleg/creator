import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  LayoutDashboard,
  Bot,
  Paintbrush,
  RefreshCw,
  Users,
  MessageSquare,
  Palette,
  Download,
  CreditCard,
  Coins,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — Not a Bot",
  description:
    "Learn how to use Not a Bot — AI-powered TikTok analytics for creators and brands.",
};

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Nav />
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-16">
          {/* Page Header */}
          <div className="space-y-4">
            <Badge variant="secondary">
              <BookOpen className="size-3" />
              Documentation
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight">
              Documentation
            </h1>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about using Not a Bot — from getting
              started to advanced features. Learn how to unlock AI-powered
              insights for your TikTok content.
            </p>
          </div>

          <Separator className="my-12" />

          {/* Getting Started */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="size-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Getting Started
              </h2>
            </div>
            <p className="text-muted-foreground">
              Get up and running with Not a Bot in just a few minutes. Follow
              these steps to connect your TikTok account and start analyzing
              your content.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    1. Create Your Account
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Sign up using your email, Google, or Apple account through
                    our secure Clerk authentication. No credit card required to
                    get started.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    2. Connect TikTok
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Link your TikTok account through the Accounts page. We use
                    TikTok&apos;s official API to securely access your public
                    analytics data.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    3. Run Your First Sync
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Trigger a full sync to pull in your videos, comments, and
                    engagement metrics. This initial sync provides a complete
                    snapshot of your account.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    4. Explore Your Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Every new account starts with a 14-day Pro trial, giving you
                    full access to all features including AI Copilot, Canvas, and
                    advanced analytics.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator className="my-12" />

          {/* Dashboard */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <LayoutDashboard className="size-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Dashboard
              </h2>
            </div>
            <p className="text-muted-foreground">
              Your command center for TikTok analytics. The dashboard provides a
              fully customizable view of your content performance with
              drag-and-drop widgets.
            </p>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Drag-and-Drop Widgets</h3>
              <p className="text-sm text-muted-foreground">
                Choose from over 30 widgets to build the perfect dashboard for
                your needs. Widgets cover engagement metrics, follower growth,
                video performance, comment trends, and more. Drag them into any
                position and resize to create your ideal layout.
              </p>
              <h3 className="text-lg font-medium">Customizable Layout</h3>
              <p className="text-sm text-muted-foreground">
                Arrange widgets in a responsive grid that adapts to your screen
                size. Save multiple layout configurations and switch between
                them. Your layout preferences persist across sessions.
              </p>
              <h3 className="text-lg font-medium">Real-Time Data</h3>
              <p className="text-sm text-muted-foreground">
                Dashboard widgets update automatically after each sync. View
                live engagement rates, trending videos, audience demographics,
                and performance comparisons — all in one place.
              </p>
            </div>
          </section>

          <Separator className="my-12" />

          {/* AI Copilot */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Bot className="size-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                AI Copilot
              </h2>
            </div>
            <p className="text-muted-foreground">
              Ask questions about your TikTok data in plain English. The AI
              Copilot analyzes your content, generates charts, and provides
              actionable insights through a conversational interface.
            </p>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Natural Language Queries</h3>
              <p className="text-sm text-muted-foreground">
                Ask anything about your data — &quot;What was my best performing
                video this month?&quot;, &quot;Show me engagement trends over the
                last 30 days&quot;, or &quot;Which posting time gets the most
                views?&quot;. The AI understands context and delivers precise
                answers.
              </p>
              <h3 className="text-lg font-medium">Chart Generation</h3>
              <p className="text-sm text-muted-foreground">
                The Copilot can generate interactive charts and visualizations on
                the fly. Request bar charts, line graphs, pie charts, and more
                to visualize your data exactly how you need it.
              </p>
              <h3 className="text-lg font-medium">Streaming Responses</h3>
              <p className="text-sm text-muted-foreground">
                Responses stream in real-time so you can start reading insights
                immediately. Complex analyses run in the background while you
                continue interacting with the Copilot.
              </p>
            </div>
          </section>

          <Separator className="my-12" />

          {/* Canvas Workspace */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Paintbrush className="size-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Canvas Workspace
              </h2>
            </div>
            <p className="text-muted-foreground">
              An infinite canvas for visual data exploration and brainstorming.
              Combine analytics with freeform creativity to plan content
              strategies and present findings.
            </p>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Infinite Canvas</h3>
              <p className="text-sm text-muted-foreground">
                Pan, zoom, and scroll across an unlimited workspace. Organize
                your ideas spatially without any boundaries. The canvas supports
                smooth navigation at any zoom level.
              </p>
              <h3 className="text-lg font-medium">Drawing Tools</h3>
              <p className="text-sm text-muted-foreground">
                Add shapes, sticky notes, text boxes, arrows, and freehand
                drawings. Use these tools to annotate data, create flowcharts,
                or build visual content calendars.
              </p>
              <h3 className="text-lg font-medium">Visual Data Exploration</h3>
              <p className="text-sm text-muted-foreground">
                Drag charts and analytics widgets directly onto the canvas.
                Arrange data visualizations alongside notes and annotations to
                build comprehensive analysis boards.
              </p>
            </div>
          </section>

          <Separator className="my-12" />

          {/* Syncing Data */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <RefreshCw className="size-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Syncing Data
              </h2>
            </div>
            <p className="text-muted-foreground">
              Keep your analytics up to date with flexible sync options. Each
              sync type is optimized for different use cases and costs a
              different number of credits.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Full Sync</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Pulls all videos, comments, and metrics from your TikTok
                    account. Best for initial setup or when you need a complete
                    data refresh. Uses 3 sync credits.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Incremental Sync</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Fetches only new and updated content since your last sync.
                    Efficient for regular updates without re-downloading
                    everything. Uses 1 sync credit.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Sync</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    A lightweight refresh that updates engagement metrics for
                    recent videos without pulling full data. Ideal for checking
                    latest stats. Uses 1 sync credit.
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">How Sync Credits Work</h3>
              <p className="text-sm text-muted-foreground">
                Sync credits are consumed each time you sync data from TikTok.
                Your plan includes a monthly credit allowance that resets on your
                billing date. You can purchase additional credit packs at any
                time if you need more.
              </p>
            </div>
          </section>

          <Separator className="my-12" />

          {/* Multi-Account Management */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="size-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Multi-Account Management
              </h2>
            </div>
            <p className="text-muted-foreground">
              Manage multiple TikTok accounts from a single Not a Bot dashboard.
              Perfect for agencies, brands, or creators with multiple channels.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Free</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-sm text-muted-foreground">
                    TikTok account
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Creator</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">5</p>
                  <p className="text-sm text-muted-foreground">
                    TikTok accounts
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pro</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">25</p>
                  <p className="text-sm text-muted-foreground">
                    TikTok accounts
                  </p>
                </CardContent>
              </Card>
            </div>
            <p className="text-sm text-muted-foreground">
              Switch between accounts instantly from the dashboard. Each account
              maintains its own sync schedule, analytics history, and data
              retention period.
            </p>
          </section>

          <Separator className="my-12" />

          {/* Comment Analysis */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="size-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Comment Analysis
              </h2>
            </div>
            <p className="text-muted-foreground">
              Understand what your audience is saying with AI-powered comment
              analysis. Automatically categorize sentiment and surface key
              themes across thousands of comments.
            </p>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                AI-Powered Sentiment Analysis
              </h3>
              <p className="text-sm text-muted-foreground">
                Every comment is analyzed for positive, negative, or neutral
                sentiment using advanced AI models. Track sentiment trends over
                time to understand how your audience reacts to different types of
                content.
              </p>
              <h3 className="text-lg font-medium">Theme Detection</h3>
              <p className="text-sm text-muted-foreground">
                The AI groups related comments together and identifies recurring
                themes, questions, and feedback patterns. Use these insights to
                guide your content strategy and engage with your community more
                effectively.
              </p>
            </div>
          </section>

          <Separator className="my-12" />

          {/* Themes & Customization */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Palette className="size-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Themes & Customization
              </h2>
            </div>
            <p className="text-muted-foreground">
              Make Not a Bot your own with extensive theming options. Choose from
              17 color palettes and switch between light and dark modes.
            </p>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">17 Color Palettes</h3>
              <p className="text-sm text-muted-foreground">
                Select from a curated collection of 17 themed color palettes
                that transform the entire interface. From vibrant and bold to
                minimal and muted, there is a palette for every taste. Your
                chosen palette applies across the dashboard, canvas, and all
                pages.
              </p>
              <h3 className="text-lg font-medium">Light & Dark Mode</h3>
              <p className="text-sm text-muted-foreground">
                Toggle between light and dark modes to suit your preference or
                environment. Each color palette is carefully designed to look
                great in both modes. Your theme preference is saved and applied
                automatically on return.
              </p>
            </div>
          </section>

          <Separator className="my-12" />

          {/* Exporting */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Download className="size-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Exporting
              </h2>
            </div>
            <p className="text-muted-foreground">
              Take your analytics offline or share them with your team. Export
              data from both the Dashboard and Canvas in multiple formats.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">PDF Export</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Generate polished PDF reports from your dashboard layout or
                    canvas boards. Perfect for presentations, client reports, or
                    archiving your analytics.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">CSV Export</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Download raw data as CSV files for further analysis in
                    spreadsheets or BI tools. Export video metrics, comment data,
                    engagement history, and more.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator className="my-12" />

          {/* Subscription Plans */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="size-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Subscription Plans
              </h2>
            </div>
            <p className="text-muted-foreground">
              Choose the plan that fits your needs. All plans include access to
              the core dashboard, canvas workspace, and AI Copilot — higher
              tiers unlock more capacity and longer data retention.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Free</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-2xl font-bold">
                    $0
                    <span className="text-sm font-normal text-muted-foreground">
                      /month
                    </span>
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>50K AI tokens per month</li>
                    <li>20 sync credits per month</li>
                    <li>7-day data retention</li>
                    <li>1 TikTok account</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Creator</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      Popular
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-2xl font-bold">
                    $14.99
                    <span className="text-sm font-normal text-muted-foreground">
                      /month
                    </span>
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>1M AI tokens per month</li>
                    <li>250 sync credits per month</li>
                    <li>30-day data retention</li>
                    <li>5 TikTok accounts</li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-2xl font-bold">
                    $29.99
                    <span className="text-sm font-normal text-muted-foreground">
                      /month
                    </span>
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>3M AI tokens per month</li>
                    <li>750 sync credits per month</li>
                    <li>90-day data retention</li>
                    <li>25 TikTok accounts</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator className="my-12" />

          {/* Credit Packs */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Coins className="size-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Credit Packs
              </h2>
            </div>
            <p className="text-muted-foreground">
              Need more sync credits? Purchase additional credit packs at any
              time. Larger packs offer a better per-credit rate. Credits never
              expire once purchased.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Starter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-2xl font-bold">$4.99</p>
                  <p className="text-sm text-muted-foreground">100 credits</p>
                  <p className="text-xs text-muted-foreground">
                    $0.050 per credit
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Value</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-2xl font-bold">$9.99</p>
                  <p className="text-sm text-muted-foreground">300 credits</p>
                  <p className="text-xs text-muted-foreground">
                    $0.033 per credit
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Power</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      Best Value
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-2xl font-bold">$19.99</p>
                  <p className="text-sm text-muted-foreground">750 credits</p>
                  <p className="text-xs text-muted-foreground">
                    $0.027 per credit
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Bulk</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-2xl font-bold">$34.99</p>
                  <p className="text-sm text-muted-foreground">1,500 credits</p>
                  <p className="text-xs text-muted-foreground">
                    $0.023 per credit
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
