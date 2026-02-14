"use client";

import { useState, type ReactNode } from "react";
import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimateOnScroll } from "@/components/landing/animate-on-scroll";

const QUERIES: { label: string; response: ReactNode }[] = [
  {
    label: "Top performing videos",
    response: (
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          Your top 5 videos by engagement rate this month:
        </p>
        <div className="flex items-end gap-1 h-32">
          {[95, 82, 74, 68, 55].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">{h}%</span>
              <div
                className="w-full rounded-t bg-primary"
                style={{ height: `${h}%`, opacity: 1 - i * 0.15 }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Video 1</span>
          <span>Video 5</span>
        </div>
      </div>
    ),
  },
  {
    label: "Engagement trends",
    response: (
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          Engagement has increased 23% over the last 30 days:
        </p>
        <div className="flex items-end gap-1 h-32">
          {[30, 35, 28, 42, 38, 50, 55, 48, 60, 65, 58, 72].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-primary"
              style={{ height: `${h}%`, opacity: 0.5 + (i / 12) * 0.5 }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>2 weeks ago</span>
          <span>Today</span>
        </div>
      </div>
    ),
  },
  {
    label: "Best posting times",
    response: (
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          Optimal posting windows based on your audience activity:
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { time: "6-8 AM", score: "High" },
            { time: "12-1 PM", score: "Medium" },
            { time: "5-7 PM", score: "Highest" },
            { time: "9-11 PM", score: "High" },
          ].map((slot) => (
            <div
              key={slot.time}
              className="rounded-lg bg-muted p-3 text-center"
            >
              <div className="text-sm font-medium">{slot.time}</div>
              <div className="text-xs text-muted-foreground">{slot.score}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    label: "Follower growth",
    response: (
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          Follower growth summary for the past month:
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "+2,847", label: "New followers" },
            { value: "12.4%", label: "Growth rate" },
            { value: "94.2%", label: "Retention" },
            { value: "38K", label: "Total followers" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg bg-muted p-3 text-center"
            >
              <div className="text-lg font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    label: "Content themes",
    response: (
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          Top performing content themes by engagement:
        </p>
        <div className="space-y-2">
          {[
            { theme: "Tutorials", pct: 92 },
            { theme: "Behind the scenes", pct: 78 },
            { theme: "Product reviews", pct: 65 },
            { theme: "Trending audio", pct: 58 },
            { theme: "Q&A", pct: 45 },
          ].map((row) => (
            <div key={row.theme} className="flex items-center gap-3">
              <span className="text-sm w-36 shrink-0">{row.theme}</span>
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${row.pct}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">
                {row.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    label: "Completion rates",
    response: (
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          Video completion rates by duration:
        </p>
        <div className="space-y-1">
          {[
            { duration: "< 15s", rate: "89%", bg: "bg-muted/80" },
            { duration: "15-30s", rate: "72%", bg: "bg-muted/60" },
            { duration: "30-60s", rate: "58%", bg: "bg-muted/80" },
            { duration: "1-3min", rate: "34%", bg: "bg-muted/60" },
            { duration: "> 3min", rate: "21%", bg: "bg-muted/80" },
          ].map((row) => (
            <div key={row.duration} className={`flex justify-between p-2 rounded ${row.bg}`}>
              <span className="text-sm">{row.duration}</span>
              <span className="text-sm font-medium">{row.rate}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    label: "Audience demographics",
    response: (
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          Your audience breakdown:
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "18-24", label: "Top age group (42%)" },
            { value: "62%", label: "Female audience" },
            { value: "US", label: "Top country (38%)" },
            { value: "Mobile", label: "Primary device (91%)" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg bg-muted p-3 text-center"
            >
              <div className="text-lg font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    label: "Revenue analytics",
    response: (
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          Revenue performance this month:
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[
            { value: "$4,280", label: "Total revenue" },
            { value: "+18%", label: "vs. last month" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg bg-muted p-3 text-center"
            >
              <div className="text-lg font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-1 h-20">
          {[45, 52, 48, 60, 55, 68, 72].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-primary"
              style={{ height: `${h}%`, opacity: 0.5 + (i / 7) * 0.5 }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>Mon</span>
          <span>Sun</span>
        </div>
      </div>
    ),
  },
];

export function InteractiveQueries() {
  const [activeQuery, setActiveQuery] = useState(0);

  return (
    <section className="border-y bg-muted/30 py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <AnimateOnScroll className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Zap className="size-3" />
            Try It
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ask anything about your TikTok data
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Your AI copilot understands plain English. Just ask a question and
            get instant insights from your analytics.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll delay={100}>
          <div className="flex flex-wrap gap-2 justify-center">
            {QUERIES.map((q, i) => (
              <button
                key={q.label}
                onClick={() => setActiveQuery(i)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  activeQuery === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={200}>
          <Card className="max-w-2xl mx-auto mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                AI Copilot
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {QUERIES.map((q, i) => (
                <div
                  key={q.label}
                  className="transition-opacity duration-300"
                  style={{
                    opacity: activeQuery === i ? 1 : 0,
                    position: activeQuery === i ? "relative" : "absolute",
                    pointerEvents: activeQuery === i ? "auto" : "none",
                    height: activeQuery === i ? "auto" : 0,
                    overflow: "hidden",
                  }}
                >
                  {q.response}
                </div>
              ))}
            </CardContent>
          </Card>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
