import Link from "next/link";
import { SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight } from "lucide-react";
import { TutorialPlayer } from "@/components/remotion/Player";
import { AnimateOnScroll } from "@/components/landing/animate-on-scroll";

export function Hero() {
  return (
    <section className="relative overflow-hidden hero-gradient py-16 md:py-24">
      {/* Floating blurred orbs for depth */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-[10%] h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

      <div className="container relative mx-auto max-w-6xl px-4">
        <AnimateOnScroll>
          <div className="flex flex-col items-center text-center">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="mr-1 size-3" />
              AI-Powered Analytics
            </Badge>
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Your TikTok Data,{" "}
              <span className="bg-gradient-to-r from-primary/80 via-primary to-primary/60 bg-clip-text text-transparent">
                Decoded by AI
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Turn your TikTok data into interactive charts, dashboards, and
              insights — just by asking a question. Real-time visualizations
              generated on-the-fly, powered by AI.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
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
              <p className="mt-4 text-sm text-muted-foreground">
                No credit card required. 250 free credits to get started.
              </p>
            </SignedOut>
          </div>
        </AnimateOnScroll>

        {/* Video showcase with browser chrome mockup */}
        <AnimateOnScroll delay={200}>
          <div className="relative mx-auto mt-12 max-w-5xl">
            {/* Glowing shadow under video */}
            <div className="absolute -bottom-6 left-1/2 h-16 w-3/4 -translate-x-1/2 rounded-full bg-primary/20 blur-[60px]" />

            <div className="relative overflow-hidden rounded-xl border shadow-2xl">
              {/* Browser chrome bar */}
              <div className="flex items-center gap-2 rounded-t-lg border-b bg-muted/80 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-red-400" />
                  <div className="size-3 rounded-full bg-yellow-400" />
                  <div className="size-3 rounded-full bg-green-400" />
                </div>
                <div className="ml-2 flex-1 rounded-md bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                  notabot.app/dashboard
                </div>
              </div>

              <TutorialPlayer />
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
