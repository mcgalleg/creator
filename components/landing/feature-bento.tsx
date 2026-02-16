"use client";

import {
  MessageSquareText,
  Layout,
  LayoutDashboard,
  MessageCircle,
  Users,
  RefreshCw,
  Palette,
  Download,
  Sparkles,
  Plug,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

function BentoCard({
  id,
  className = "",
  icon: Icon,
  title,
  description,
  children,
}: {
  id?: string;
  className?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className={`group relative rounded-xl border bg-card/50 backdrop-blur-sm p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 ${className}`}
    >
      <div className="relative z-10">
        <Icon className="size-5 text-primary mb-3" />
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function ChatMockup() {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex justify-end">
        <div className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-muted-foreground max-w-[70%]">
          Show me engagement trends for this week
        </div>
      </div>
      <div className="flex justify-start">
        <div className="rounded-lg bg-muted px-3 py-2 max-w-[80%] space-y-2">
          <div className="text-xs text-muted-foreground">
            Your engagement is up 24% this week.
          </div>
          <div className="h-16 rounded bg-gradient-to-t from-primary/20 to-primary/5 flex items-end gap-1 p-2">
            {[40, 55, 35, 70, 60, 80, 75].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-primary/40"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CanvasMockup() {
  return (
    <div className="mt-4 relative h-32 rounded-lg border bg-card overflow-hidden bg-[radial-gradient(circle,_var(--border)_1px,_transparent_1px)] bg-[size:16px_16px]">
      <div className="absolute top-3 left-3 w-20 h-14 rounded bg-yellow-400/20 border border-yellow-400/30 p-1.5">
        <div className="h-1.5 w-12 rounded bg-yellow-500/40 mb-1" />
        <div className="h-1.5 w-8 rounded bg-yellow-500/30" />
      </div>
      <div className="absolute top-5 right-4 w-16 h-12 rounded bg-blue-400/20 border border-blue-400/30 p-1.5">
        <div className="h-1.5 w-10 rounded bg-blue-500/40 mb-1" />
        <div className="h-1.5 w-6 rounded bg-blue-500/30" />
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-24 h-14 rounded bg-muted border p-1.5">
        <div className="h-full flex items-end gap-0.5">
          {[60, 80, 45, 70, 55].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-primary/30"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardMiniMockup() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <div className="h-10 rounded bg-primary/10 border border-primary/20" />
      <div className="h-10 rounded bg-blue-500/10 border border-blue-500/20" />
      <div className="h-10 rounded bg-emerald-500/10 border border-emerald-500/20" />
      <div className="h-10 rounded bg-orange-500/10 border border-orange-500/20" />
    </div>
  );
}

function SentimentMockup() {
  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className="text-xs text-muted-foreground w-16">Positive</div>
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-3/4 rounded-full bg-emerald-500/60" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs text-muted-foreground w-16">Neutral</div>
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-blue-500/60" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs text-muted-foreground w-16">Negative</div>
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-1/5 rounded-full bg-red-500/60" />
        </div>
      </div>
    </div>
  );
}

function McpClientMockup() {
  return (
    <div className="mt-4 space-y-2">
      {["Claude Desktop", "ChatGPT", "Claude Code"].map((client) => (
        <div
          key={client}
          className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
        >
          <Plug className="size-3 text-primary" />
          <span>{client}</span>
          <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
            Connected
          </span>
        </div>
      ))}
    </div>
  );
}

export function FeatureBento() {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Features
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Everything you need to grow
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A complete toolkit for understanding your audience, crafting content,
            and making data-driven decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 auto-rows-[minmax(180px,auto)]">
          {/* Hero cards */}
          <BentoCard
            id="ai-copilot"
            className="sm:col-span-2 lg:col-span-3 lg:row-span-2 scroll-mt-20"
            icon={MessageSquareText}
            title="AI Chat Copilot"
            description="Ask questions about your data in plain English and get instant visual answers."
          >
            <ChatMockup />
          </BentoCard>

          <BentoCard
            id="canvas"
            className="sm:col-span-2 lg:col-span-3 lg:row-span-2 scroll-mt-20"
            icon={Layout}
            title="Canvas Workspace"
            description="Drag notes, shapes, and insights onto a freeform canvas for visual exploration."
          >
            <CanvasMockup />
          </BentoCard>

          {/* Medium cards */}
          <BentoCard
            id="dashboard"
            className="lg:col-span-2 scroll-mt-20"
            icon={LayoutDashboard}
            title="Dynamic Dashboard"
            description="Drag-and-drop widgets to build your perfect analytics view."
          >
            <DashboardMiniMockup />
          </BentoCard>

          <BentoCard
            className="lg:col-span-2"
            icon={MessageCircle}
            title="Comment Analysis"
            description="AI-powered sentiment analysis across all your comments."
          >
            <SentimentMockup />
          </BentoCard>

          <BentoCard
            id="mcp"
            className="lg:col-span-2 scroll-mt-20"
            icon={Plug}
            title="Use Your Own AI Client"
            description="Connect Claude Desktop, ChatGPT, or any MCP-compatible client to query your analytics with natural language."
          >
            <McpClientMockup />
          </BentoCard>

          {/* Small cards */}
          <BentoCard
            className="lg:col-span-2"
            icon={Users}
            title="Multi-Account"
            description="Manage up to 25 accounts"
          />
          <BentoCard
            className="lg:col-span-2"
            icon={RefreshCw}
            title="Smart Sync"
            description="Full, incremental, or quick sync — pull fresh video stats, follower data, and engagement metrics from TikTok on your schedule"
          />
          <BentoCard
            className="lg:col-span-2"
            icon={Palette}
            title="17 Themes"
            description="Match your brand"
          >
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                "#f59e0b", // amber
                "#3b82f6", // blue
                "#06b6d4", // cyan
                "#10b981", // emerald
                "#d946ef", // fuchsia
                "#22c55e", // green
                "#6366f1", // indigo
                "#84cc16", // lime
                "#f97316", // orange
                "#ec4899", // pink
                "#a855f7", // purple
                "#ef4444", // red
                "#f43f5e", // rose
                "#0ea5e9", // sky
                "#14b8a6", // teal
                "#8b5cf6", // violet
                "#eab308", // yellow
              ].map((color) => (
                <div
                  key={color}
                  className="size-4 rounded-full ring-1 ring-border/50"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </BentoCard>
          <BentoCard
            className="lg:col-span-2"
            icon={Download}
            title="Export Reports"
            description="Export your Canvas workspace and dashboard views as PDF or CSV for sharing and offline analysis"
          />
          <BentoCard
            className="lg:col-span-2"
            icon={Sparkles}
            title="Streaming UI"
            description="Real-time visualizations"
          />
        </div>
      </div>
    </section>
  );
}
