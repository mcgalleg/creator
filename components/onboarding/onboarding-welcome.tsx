"use client";

import { TrendingUp, Users, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface OnboardingWelcomeProps {
  onContinue: () => void;
  onSkip: () => void;
}

const VALUE_PROPS = [
  {
    icon: TrendingUp,
    title: "Track Performance",
    description: "Monitor views, likes, and followers over time with beautiful charts and dashboards.",
  },
  {
    icon: Users,
    title: "Understand Your Audience",
    description: "Discover what content resonates and drives the most engagement.",
  },
  {
    icon: MessageSquareText,
    title: "AI Insights",
    description: "Chat with AI about your analytics to uncover trends and opportunities.",
    badge: "Included in Trial",
  },
];

export function OnboardingWelcome({ onContinue, onSkip }: OnboardingWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
      <div className="max-w-2xl mx-auto w-full text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Welcome to Astriq
          </h1>
          <p className="text-muted-foreground text-lg">
            Connect your TikTok account to unlock powerful analytics and insights.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {VALUE_PROPS.map((prop) => (
            <div
              key={prop.title}
              className="rounded-xl border bg-card p-5 space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <prop.icon className="h-5 w-5 text-primary" />
                </div>
                {prop.badge && (
                  <Link
                    href="/pricing"
                    className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground border rounded-full px-2 py-0.5 hover:text-foreground transition-colors"
                  >
                    {prop.badge}
                  </Link>
                )}
              </div>
              <div>
                <h3 className="font-semibold">{prop.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {prop.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-2">
          <Button size="lg" onClick={onContinue} className="w-full sm:w-auto px-8">
            Get Started
          </Button>
          <div>
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
