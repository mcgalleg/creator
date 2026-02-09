import Link from "next/link";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  MessageSquareText,
  Sparkles,
  Users,
  Coins,
  Link as LinkIcon,
  RefreshCw,
  TrendingUp,
  ArrowRight,
  Zap,
} from "lucide-react";
import { LazyPixelBlastBg } from "@/components/backgrounds/lazy-pixel-blast-bg";
import { AccentColorPicker } from "@/components/accent-color-picker";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-3 md:px-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Not a Bot"
              width={120}
              height={40}
              className="h-16 pb-2 w-auto dark:invert"
              priority
            />
          </div>
          <nav className="flex items-center gap-4">
            <AccentColorPicker />
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">Get Started</Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="sm">Go to Dashboard</Button>
              </Link>
            </SignedIn>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative container mx-auto max-w-6xl px-4 py-24 text-center md:py-32">
          {/* PixelBlast as absolute background */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <LazyPixelBlastBg
              useThemeColor
              className="h-full w-full"
            />
          </div>
          {/* Content - above PixelBlast */}
          <Badge variant="secondary" className="relative z-10 mb-4">
            <Sparkles className="mr-1 size-3" />
            AI-Powered Analytics
          </Badge>
          <h1 className="relative z-10 mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Understand Your TikTok Performance with{" "}
            <span className="bg-gradient-to-r from-primary/80 via-primary to-primary/60 bg-clip-text text-transparent">
              AI-Powered Insights
            </span>
          </h1>
          <p className="relative z-10 mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Ask questions in plain English and get instant, actionable insights about your TikTok
            analytics. Beautiful visualizations generated on-the-fly, powered by AI.
          </p>
          <div className="relative z-10 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <SignedOut>
              <SignUpButton mode="modal">
                <Button size="lg" className="gap-2">
                  Start Free Trial
                  <ArrowRight className="size-4" />
                </Button>
              </SignUpButton>
            </SignedOut>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="gap-2">
                <SignedIn>Go to Dashboard</SignedIn>
                <SignedOut>View Demo</SignedOut>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
          <SignedOut>
            <p className="relative z-10 mt-4 text-sm text-muted-foreground">
              No credit card required. 100 free credits to get started.
            </p>
          </SignedOut>
        </section>

        {/* Features Section */}
        <section className="border-y bg-muted/30 py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center">
              <Badge variant="outline" className="mb-4">
                Features
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to grow on TikTok
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Powerful tools designed to help creators and brands understand their audience and
                optimize their content strategy.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="mb-2 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                    <MessageSquareText className="size-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">AI Analytics Copilot</CardTitle>
                  <CardDescription>
                    Ask questions in natural language. Get insights instantly. No complex
                    dashboards to navigate.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="mb-2 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="size-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Streaming UI</CardTitle>
                  <CardDescription>
                    Watch beautiful charts and visualizations generate in real-time as the AI
                    analyzes your data.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="mb-2 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="size-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Multi-Account Support</CardTitle>
                  <CardDescription>
                    Manage all your TikTok accounts in one place. Perfect for agencies and
                    multi-brand creators.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="mb-2 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                    <Coins className="size-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Credit-Based Sync</CardTitle>
                  <CardDescription>
                    Pay only for what you use. Sync your data when you need it, with transparent
                    credit-based pricing.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center">
              <Badge variant="outline" className="mb-4">
                How It Works
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Get started in three simple steps
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                From connection to insights in minutes. No technical setup required.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <div className="relative flex flex-col items-center text-center">
                <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  1
                </div>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-muted">
                  <LinkIcon className="size-6 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Connect Your Account</h3>
                <p className="mt-2 text-muted-foreground">
                  Securely link your TikTok account with just a few clicks. We use official APIs
                  for safe, authorized access.
                </p>
                {/* Connector line */}
                <div className="absolute right-0 top-8 hidden h-0.5 w-1/2 bg-border md:block" />
              </div>

              <div className="relative flex flex-col items-center text-center">
                <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  2
                </div>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-muted">
                  <RefreshCw className="size-6 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Sync Your Data</h3>
                <p className="mt-2 text-muted-foreground">
                  Pull in your videos, engagement metrics, and audience insights. Pay only for
                  the syncs you need.
                </p>
                {/* Connector lines */}
                <div className="absolute left-0 top-8 hidden h-0.5 w-1/2 bg-border md:block" />
                <div className="absolute right-0 top-8 hidden h-0.5 w-1/2 bg-border md:block" />
              </div>

              <div className="relative flex flex-col items-center text-center">
                <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  3
                </div>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-muted">
                  <TrendingUp className="size-6 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Ask Questions, Get Insights</h3>
                <p className="mt-2 text-muted-foreground">
                  Start chatting with your AI copilot. Ask anything about your performance and get
                  instant visualizations.
                </p>
                {/* Connector line */}
                <div className="absolute left-0 top-8 hidden h-0.5 w-1/2 bg-border md:block" />
              </div>
            </div>
          </div>
        </section>

        {/* Sample Questions Section */}
        <section className="border-y bg-muted/30 py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center">
              <Badge variant="outline" className="mb-4">
                <Zap className="mr-1 size-3" />
                Example Queries
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ask anything about your TikTok data
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Natural language queries that your AI copilot understands and answers with
                beautiful visualizations.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "What are my top performing videos this month?",
                "Show me engagement trends over the past 30 days",
                "Which posting times get the most views?",
                "Compare my follower growth week over week",
                "What content themes resonate with my audience?",
                "Analyze my video completion rates",
              ].map((question, index) => (
                <Card key={index} className="bg-background">
                  <CardContent className="flex items-center gap-3 py-4">
                    <MessageSquareText className="size-5 shrink-0 text-muted-foreground" />
                    <span className="text-sm">{question}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
              <CardContent className="flex flex-col items-center p-12 text-center">
                <Badge variant="secondary" className="mb-4">
                  Start Today
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Ready to understand your TikTok performance?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                  Join creators and brands who are using AI to unlock insights from their TikTok
                  data. Start with 100 free credits.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <SignedOut>
                    <SignUpButton mode="modal">
                      <Button size="lg" className="gap-2">
                        Get Started Free
                        <ArrowRight className="size-4" />
                      </Button>
                    </SignUpButton>
                  </SignedOut>
                  <Link href="/dashboard">
                    <Button variant="outline" size="lg" className="gap-2">
                      <SignedIn>Go to Dashboard</SignedIn>
                      <SignedOut>Explore Dashboard</SignedOut>
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Not a Bot"
                width={100}
                height={33}
                className="h-6 w-auto dark:invert"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Built with AI. Designed for creators.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
