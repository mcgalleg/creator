import Link from "next/link";
import {
  Sparkles,
  LayoutDashboard,
  PenTool,
  MessageSquare,
} from "lucide-react";
import { SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimateOnScroll } from "@/components/landing/animate-on-scroll";

export function FinalCta() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Floating blurred orbs */}
      <div className="absolute top-10 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-6xl px-4 relative z-10">
        <AnimateOnScroll>
          <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-0">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Ready to decode your TikTok data?
                </span>
              </h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
                Start your 14-day Pro trial. No credit card required.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                <SignedOut>
                  <SignUpButton mode="modal">
                    <Button size="lg">Get Started Free</Button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <Button asChild size="lg">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                </SignedIn>
                <Button asChild variant="outline" size="lg">
                  <Link href="/dashboard">Explore Dashboard</Link>
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 mt-8 text-muted-foreground">
                <Sparkles className="size-5" />
                <LayoutDashboard className="size-5" />
                <PenTool className="size-5" />
                <MessageSquare className="size-5" />
              </div>
            </CardContent>
          </Card>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
