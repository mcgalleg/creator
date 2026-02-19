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
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CanvasInteractiveMockup } from "./canvas-interactive-mockup";
import { DashboardInteractiveMockup } from "./dashboard-interactive-mockup";

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
    <div className="mt-4 flex flex-col rounded-lg border bg-card/80 overflow-hidden">
      <style>{`
        @keyframes chatSlideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes chatDraw{from{stroke-dashoffset:300}to{stroke-dashoffset:0}}
        @keyframes chatReveal{from{opacity:0}to{opacity:1}}
        @keyframes chatBlink{0%,100%{opacity:.3}50%{opacity:1}}
        .c-msg{opacity:0;animation:chatSlideIn .4s ease-out forwards}
        .c-draw{stroke-dasharray:300;stroke-dashoffset:300;animation:chatDraw 1s ease-out forwards}
        .c-reveal{opacity:0;animation:chatReveal .5s ease-out forwards}
        .c-blink{animation:chatBlink 1s ease-in-out infinite}
      `}</style>

      {/* Header bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/30">
        <div className="flex size-4 items-center justify-center rounded bg-primary/10">
          <Sparkles className="size-2.5 text-primary" />
        </div>
        <span className="text-[11px] font-medium">AI Copilot</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] text-muted-foreground">Online</span>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 px-3 py-3 space-y-3 overflow-hidden">
        {/* User message */}
        <div
          className="c-msg flex justify-end"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="rounded-2xl rounded-tr-sm bg-primary/10 border border-primary/15 px-3 py-1.5 text-[11px] text-foreground/80">
            Show me engagement trends for this week
          </div>
        </div>

        {/* AI response */}
        <div
          className="c-msg flex gap-2.5"
          style={{ animationDelay: "1s" }}
        >
          <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/15">
            <Sparkles className="size-2.5 text-primary" />
          </div>
          <div className="space-y-2 min-w-0 flex-1">
            <p className="text-[11px] text-foreground/80 leading-relaxed">
              Engagement is{" "}
              <span className="font-semibold text-emerald-500">up 24%</span>{" "}
              this week with{" "}
              <span className="font-semibold text-primary">
                2.1M total views
              </span>
              . Peak day was <span className="font-medium">Saturday</span>.
            </p>

            {/* Chart card */}
            <div className="rounded-lg border bg-muted/30 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-medium text-foreground/60 uppercase tracking-wider">
                  Daily Views
                </span>
                <span className="text-[9px] font-semibold text-emerald-500">
                  +24%
                </span>
              </div>
              <svg viewBox="0 0 220 55" className="w-full" style={{ height: 48 }}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--primary)"
                      stopOpacity="0.25"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--primary)"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[15, 30, 45].map((y) => (
                  <line
                    key={y}
                    x1="20"
                    y1={y}
                    x2="212"
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.05"
                    strokeWidth="0.5"
                    strokeDasharray="2 3"
                  />
                ))}
                {/* Gradient fill */}
                <path
                  className="c-reveal"
                  style={{ animationDelay: "2s" }}
                  d="M25,47 L56,38 L87,41 L118,16 L149,27 L180,6 L211,12 L211,50 L25,50 Z"
                  fill="url(#cg)"
                />
                {/* Line */}
                <polyline
                  className="c-draw"
                  style={{ animationDelay: "1.6s" }}
                  points="25,47 56,38 87,41 118,16 149,27 180,6 211,12"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Data dots */}
                {[
                  [25, 47],
                  [56, 38],
                  [87, 41],
                  [118, 16],
                  [149, 27],
                  [180, 6],
                  [211, 12],
                ].map(([cx, cy], i) => (
                  <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r="2"
                    fill="var(--primary)"
                    className="c-reveal"
                    style={{ animationDelay: `${2.2 + i * 0.08}s` }}
                  />
                ))}
                {/* Highlight ring on peak (Saturday) */}
                <circle
                  cx={180}
                  cy={6}
                  r="4"
                  fill="var(--primary)"
                  fillOpacity="0.12"
                  className="c-reveal"
                  style={{ animationDelay: "2.7s" }}
                />
              </svg>
              <div className="flex justify-between px-1 text-[8px] text-muted-foreground/50">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </div>

            {/* Metric pills */}
            <div
              className="c-msg flex gap-1.5 flex-wrap"
              style={{ animationDelay: "2.5s" }}
            >
              {[
                { label: "Views", value: "2.1M", cls: "text-primary" },
                { label: "Likes", value: "45.2K", cls: "text-rose-400" },
                { label: "Shares", value: "8.3K", cls: "text-blue-400" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-md border bg-muted/40 px-2 py-0.5 text-[9px]"
                >
                  <span className="text-muted-foreground">{m.label}</span>{" "}
                  <span className={`font-semibold ${m.cls}`}>{m.value}</span>
                </div>
              ))}
            </div>

            {/* Follow-up suggestions */}
            <div
              className="c-msg flex gap-1.5 flex-wrap"
              style={{ animationDelay: "3s" }}
            >
              {["Which post drove the spike?", "Compare to last week"].map(
                (q) => (
                  <div
                    key={q}
                    className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[9px] text-primary/70"
                  >
                    {q}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="px-3 py-2 border-t bg-muted/20">
        <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-1.5">
          <span className="text-[10px] text-muted-foreground/40 flex items-center">
            Ask about your data
            <span className="c-blink ml-0.5 inline-block w-px h-3 bg-muted-foreground/40" />
          </span>
          <div className="ml-auto flex size-5 items-center justify-center rounded-lg bg-primary/10">
            <Send className="size-2.5 text-primary/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

const MORE_FEATURES = [
  {
    icon: MessageCircle,
    title: "Comment Analysis",
    desc: "AI-powered sentiment analysis across all your comments",
  },
  {
    icon: Users,
    title: "Multi-Account",
    desc: "Manage up to 25 TikTok accounts in one place",
  },
  {
    icon: RefreshCw,
    title: "Smart Sync",
    desc: "Full, incremental, or quick sync on your schedule",
  },
  {
    icon: Download,
    title: "Export Reports",
    desc: "Download canvas and dashboards as PDF or CSV",
  },
  {
    icon: Sparkles,
    title: "Streaming UI",
    desc: "Watch charts and insights render in real time",
  },
];

const THEME_COLORS = [
  "#f59e0b", "#3b82f6", "#06b6d4", "#10b981", "#d946ef",
  "#22c55e", "#6366f1", "#84cc16", "#f97316", "#ec4899",
  "#a855f7", "#ef4444", "#f43f5e", "#0ea5e9", "#14b8a6",
  "#8b5cf6", "#eab308",
];

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
            <CanvasInteractiveMockup />
          </BentoCard>

          {/* Medium cards */}
          <BentoCard
            id="dashboard"
            className="lg:col-span-2 scroll-mt-20"
            icon={LayoutDashboard}
            title="Dynamic Dashboard"
            description="Drag-and-drop widgets to build your perfect analytics view."
          >
            <DashboardInteractiveMockup />
          </BentoCard>

          {/* More features — consolidated */}
          <div className="lg:col-span-4 group relative rounded-xl border bg-card/50 backdrop-blur-sm p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              {MORE_FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <f.icon className="size-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{f.title}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      {f.desc}
                    </div>
                  </div>
                </div>
              ))}
              {/* 17 Themes — with color swatches */}
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Palette className="size-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">17 Themes</div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {THEME_COLORS.map((color) => (
                      <div
                        key={color}
                        className="size-3.5 rounded-full ring-1 ring-border/50"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MCP Hero Card */}
          <BentoCard
            id="mcp"
            className="sm:col-span-2 lg:col-span-6 lg:row-span-2 scroll-mt-20"
            icon={Plug}
            title="MCP Apps — Bring Your Own AI"
            description="Connect Claude Desktop, ChatGPT, or any MCP-compatible client to query your TikTok analytics with natural language. No subscription required — just buy sync credits as you go."
          >
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compatible Clients</h4>
                {["Claude Desktop", "ChatGPT", "Claude Code"].map((client) => (
                  <div
                    key={client}
                    className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
                  >
                    <Plug className="size-3 text-primary" />
                    <span>{client}</span>
                    <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                      Supported
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">How It Works</h4>
                <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">1</span>
                    <p className="text-xs text-muted-foreground">Activate MCP Apps for free</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">2</span>
                    <p className="text-xs text-muted-foreground">Buy a sync credit pack</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">3</span>
                    <p className="text-xs text-muted-foreground">Add the MCP server URL to your AI client</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sample Chat</h4>
                <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                  <div className="flex justify-end">
                    <div className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-[11px] text-muted-foreground max-w-[85%]">
                      Who are my biggest fans?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-muted px-2.5 py-1.5 text-[11px] text-muted-foreground max-w-[85%] space-y-1.5">
                      <div>Here are your top commenters:</div>
                      <div className="flex items-center gap-1.5">
                        <div className="size-4 rounded-full bg-primary/20" />
                        <span className="font-medium">@sarah_creates</span>
                        <span className="ml-auto text-primary">47 comments</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="size-4 rounded-full bg-primary/15" />
                        <span className="font-medium">@mike_fitness</span>
                        <span className="ml-auto text-primary">32 comments</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BentoCard>

        </div>
      </div>
    </section>
  );
}
