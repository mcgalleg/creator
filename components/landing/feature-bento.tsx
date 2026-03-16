"use client";

import {
  MessageSquareText,
  Layout,
  MessageCircle,
  Users,
  RefreshCw,
  Palette,
  Sparkles,
  Plug,
  Send,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CanvasInteractiveMockup } from "./canvas-interactive-mockup";
import { AnimateOnScroll } from "./animate-on-scroll";

function ChatMockup() {
  return (
    <div className="flex flex-col rounded-lg border bg-card/80 overflow-hidden">
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
    desc: "Manage up to 50 TikTok accounts in one place",
  },
  {
    icon: RefreshCw,
    title: "Smart Sync",
    desc: "Full, incremental, or quick sync on your schedule",
  },
  {
    icon: Sparkles,
    title: "Streaming UI",
    desc: "Watch charts and insights render in real time",
  },
  {
    icon: Users,
    title: "Account Comparison",
    desc: "Compare performance across multiple TikTok accounts side by side",
  },
  {
    icon: TrendingUp,
    title: "Best Time to Post",
    desc: "AI-driven insights on the optimal days and times to publish for maximum reach",
  },
];

const THEME_COLORS = [
  "#f59e0b", "#3b82f6", "#06b6d4", "#10b981", "#d946ef",
  "#22c55e", "#6366f1", "#84cc16", "#f97316", "#ec4899",
  "#a855f7", "#ef4444", "#f43f5e", "#0ea5e9", "#14b8a6",
  "#8b5cf6", "#eab308",
];

const STICKY_TOP = "100px";

/* Neutral card backgrounds — stepping from lighter to darker (light mode)
   and darker to lighter (dark mode) so each card is visually distinct */
const CARD_STYLES = `
  #features { --card-1: oklch(0.97 0 0); --card-2: oklch(0.94 0 0); --card-3: oklch(0.91 0 0); --card-4: oklch(0.88 0 0); --card-5: oklch(0.85 0 0); }
  .dark #features { --card-1: oklch(0.20 0 0); --card-2: oklch(0.23 0 0); --card-3: oklch(0.26 0 0); --card-4: oklch(0.29 0 0); --card-5: oklch(0.32 0 0); }
`;

export function FeatureBento() {
  return (
    <section id="features" className="py-24 md:py-32 bg-background">
      <style>{CARD_STYLES}</style>
      <div className="container mx-auto max-w-6xl px-4">
        {/* Animated header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">
            Features
          </Badge>
          <AnimateOnScroll>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-4">
              Everything you need to grow
            </h2>
          </AnimateOnScroll>
          <AnimateOnScroll delay={200}>
            <p className="text-lg text-muted-foreground">
              A complete toolkit for understanding your audience, crafting
              content, and making data-driven decisions.
            </p>
          </AnimateOnScroll>
        </div>

        {/* Sticky scroll cards */}
        <div className="w-full">
          {/* Card 1: AI Chat Copilot */}
          <div id="ai-copilot" className="scroll-mt-20" />
          <div
            className="grid grid-cols-1 md:grid-cols-2 items-center gap-6 md:gap-10 p-8 md:p-12 rounded-3xl mb-10 sticky z-[1] scroll-mt-20 min-h-[500px]"
            style={{ top: STICKY_TOP, backgroundColor: "var(--card-1)" }}
          >
            <div className="flex flex-col justify-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <MessageSquareText className="size-5 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                AI Chat Copilot
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Ask questions about your data in plain English and get instant
                visual answers with charts, metrics, and actionable insights.
              </p>
            </div>
            <div>
              <ChatMockup />
            </div>
          </div>

          {/* Card 2: Canvas Workspace */}
          <div id="canvas" className="scroll-mt-20" />
          <div
            className="grid grid-cols-1 md:grid-cols-2 items-center gap-6 md:gap-10 p-8 md:p-12 rounded-3xl mb-10 sticky z-[2] scroll-mt-20 min-h-[500px]"
            style={{ top: STICKY_TOP, backgroundColor: "var(--card-2)" }}
          >
            <div className="flex flex-col justify-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Layout className="size-5 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                Canvas Workspace
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Drag notes, shapes, and insights onto a freeform canvas for
                visual exploration. Think and create at your own pace.
              </p>
            </div>
            <div>
              <CanvasInteractiveMockup />
            </div>
          </div>

          {/* Card 3: MCP Apps */}
          <div id="mcp" className="scroll-mt-20" />
          <div
            className="grid grid-cols-1 md:grid-cols-2 items-center gap-6 md:gap-10 p-8 md:p-12 rounded-3xl mb-10 sticky z-[3] scroll-mt-20 min-h-[500px]"
            style={{ top: STICKY_TOP, backgroundColor: "var(--card-3)" }}
          >
            <div className="flex flex-col justify-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Plug className="size-5 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                MCP Apps — Bring Your Own AI
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Connect Claude Desktop, ChatGPT, or any MCP-compatible client to
                query your TikTok analytics with natural language. No
                subscription required — just buy sync credits as you go.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Compatible Clients
                </h4>
                {["Claude Desktop", "ChatGPT", "Claude Code"].map((client) => (
                  <div
                    key={client}
                    className="flex items-center gap-2 rounded-lg border bg-card/80 px-3 py-2 text-xs text-muted-foreground"
                  >
                    <Plug className="size-3 text-primary" />
                    <span>{client}</span>
                    <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                      Supported
                    </span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border bg-card/80 p-3 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  How It Works
                </h4>
                {[
                  "Activate MCP Apps for free",
                  "Buy a sync credit pack",
                  "Add the MCP server URL to your AI client",
                ].map((step, i) => (
                  <div key={step} className="flex items-start gap-2">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                      {i + 1}
                    </span>
                    <p className="text-xs text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 4: More Features */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 items-start gap-6 md:gap-10 p-8 md:p-12 rounded-3xl mb-10 sticky z-[4] min-h-[500px]"
            style={{ top: STICKY_TOP, backgroundColor: "var(--card-4)" }}
          >
            <div className="flex flex-col justify-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Sparkles className="size-5 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                And So Much More
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Everything else you need for a complete analytics workflow.
              </p>
            </div>
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
        </div>
      </div>
    </section>
  );
}
