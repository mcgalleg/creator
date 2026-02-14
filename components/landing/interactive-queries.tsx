"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  LayoutGrid,
  BarChart3,
  FileText,
  Heart,
  MessageCircle,
  Users,
  Play,
  TrendingUp,
  ThumbsUp,
  Share2,
  Bookmark,
  Eye,
  Gauge,
  Activity,
  PieChart,
  Clock,
  CalendarDays,
  LineChart,
  Timer,
  Video,
  Flame,
  AlertTriangle,
  MessageSquare,
  UserCheck,
  SmilePlus,
  Crown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimateOnScroll } from "@/components/landing/animate-on-scroll";

type WidgetCategory = "all" | "kpi" | "chart" | "content" | "engagement" | "comments";

interface WidgetItem {
  id: string;
  name: string;
  description: string;
  category: Exclude<WidgetCategory, "all">;
  icon: React.ComponentType<{ className?: string }>;
  preview: ReactNode;
}

const CATEGORY_CONFIG: {
  key: WidgetCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "all", label: "All", icon: LayoutGrid },
  { key: "kpi", label: "KPIs", icon: LayoutGrid },
  { key: "chart", label: "Charts", icon: BarChart3 },
  { key: "content", label: "Content", icon: FileText },
  { key: "engagement", label: "Engagement", icon: Heart },
  { key: "comments", label: "Comments", icon: MessageCircle },
];

/* ------------------------------------------------------------------ */
/*  Tiny reusable preview building blocks                             */
/* ------------------------------------------------------------------ */

function KpiPreview({
  value,
  change,
  up = true,
}: {
  value: string;
  change: string;
  up?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-lg font-bold leading-tight">{value}</span>
      <span
        className={`text-[10px] font-medium ${
          up
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {change}
      </span>
    </div>
  );
}

function MiniBarChart({ bars, color = "bg-primary/40" }: { bars: number[]; color?: string }) {
  return (
    <div className="flex items-end gap-0.5 h-10 w-full">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${color}`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function MiniAreaChart() {
  return (
    <svg viewBox="0 0 120 40" className="w-full h-10" preserveAspectRatio="none">
      <path
        d="M0,30 C15,28 30,18 45,22 C60,26 75,12 90,15 C105,18 112,8 120,10 L120,40 L0,40Z"
        className="fill-primary/15"
      />
      <path
        d="M0,30 C15,28 30,18 45,22 C60,26 75,12 90,15 C105,18 112,8 120,10"
        className="stroke-primary"
        fill="none"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function MiniLineChart() {
  return (
    <svg viewBox="0 0 120 40" className="w-full h-10" preserveAspectRatio="none">
      <path
        d="M0,35 C20,30 40,28 60,22 C80,16 100,12 120,5"
        className="stroke-primary"
        fill="none"
        strokeWidth="1.5"
      />
      <circle cx="120" cy="5" r="2" className="fill-primary" />
    </svg>
  );
}

function MiniHeatmap() {
  const cells = [
    [0.2, 0.4, 0.8, 0.6, 0.3],
    [0.5, 0.7, 0.9, 0.8, 0.4],
    [0.3, 0.6, 1.0, 0.7, 0.5],
    [0.1, 0.3, 0.6, 0.4, 0.2],
  ];
  return (
    <div className="grid grid-cols-5 gap-[2px] w-full">
      {cells.flat().map((v, i) => (
        <div
          key={i}
          className="aspect-square rounded-[2px] bg-primary"
          style={{ opacity: v * 0.8 + 0.1 }}
        />
      ))}
    </div>
  );
}

function MiniDonut({ slices }: { slices: { pct: number; color: string }[] }) {
  // Precompute cumulative offsets to avoid reassignment during render
  const offsets = slices.reduce<number[]>(
    (acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + slices[i - 1].pct],
    []
  );
  return (
    <svg viewBox="0 0 36 36" className="size-10">
      {slices.map((s, i) => (
        <circle
          key={i}
          cx="18"
          cy="18"
          r="15.91"
          fill="none"
          stroke={s.color}
          strokeWidth="3"
          strokeDasharray={`${s.pct} ${100 - s.pct}`}
          strokeDashoffset={100 - offsets[i] + 25}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function MiniThumbnailGrid() {
  return (
    <div className="grid grid-cols-3 gap-1 w-full">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="aspect-[9/16] rounded bg-muted flex items-end p-0.5"
        >
          <div className="text-[6px] text-muted-foreground">
            {["12K", "8.5K", "6.2K"][i - 1]}
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniPostList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-1 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="size-5 rounded bg-muted shrink-0" />
          <div className="flex-1 space-y-0.5">
            <div
              className="h-1 rounded bg-muted-foreground/20"
              style={{ width: `${80 - i * 15}%` }}
            />
            <div
              className="h-1 rounded bg-muted-foreground/10"
              style={{ width: `${50 - i * 10}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniCommentList() {
  return (
    <div className="space-y-1 w-full">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-1">
          <div className="size-3 rounded-full bg-muted shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="h-1 w-8 rounded bg-muted-foreground/30 mb-0.5" />
            <div
              className="h-1 rounded bg-muted-foreground/15"
              style={{ width: `${90 - i * 20}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniSentimentBars() {
  return (
    <div className="space-y-1 w-full">
      {[
        { w: "72%", color: "bg-emerald-500" },
        { w: "20%", color: "bg-blue-400" },
        { w: "8%", color: "bg-red-400" },
      ].map((s, i) => (
        <div key={i} className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full ${s.color}`}
            style={{ width: s.w }}
          />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  All 31 widget definitions for the landing page showcase           */
/* ------------------------------------------------------------------ */

const ALL_WIDGETS: WidgetItem[] = [
  // --- KPI (9) ---
  {
    id: "followers",
    name: "Followers",
    description: "Follower count with trend indicator",
    category: "kpi",
    icon: Users,
    preview: <KpiPreview value="12.4K" change="+3.2%" />,
  },
  {
    id: "total-plays",
    name: "Total Plays",
    description: "Total video plays with trend",
    category: "kpi",
    icon: Play,
    preview: <KpiPreview value="847K" change="+8.1%" />,
  },
  {
    id: "engagement-rate",
    name: "Engagement Rate",
    description: "Current engagement percentage",
    category: "kpi",
    icon: TrendingUp,
    preview: <KpiPreview value="4.2%" change="+0.5%" />,
  },
  {
    id: "total-likes",
    name: "Total Likes",
    description: "Sum of all likes with trend",
    category: "kpi",
    icon: ThumbsUp,
    preview: <KpiPreview value="234K" change="+5.7%" />,
  },
  {
    id: "total-shares",
    name: "Total Shares",
    description: "Sum of all shares with trend",
    category: "kpi",
    icon: Share2,
    preview: <KpiPreview value="18.2K" change="+12.3%" />,
  },
  {
    id: "total-saves",
    name: "Total Saves",
    description: "Sum of all saves with trend",
    category: "kpi",
    icon: Bookmark,
    preview: <KpiPreview value="42.1K" change="+7.8%" />,
  },
  {
    id: "avg-views",
    name: "Avg Views",
    description: "Average views per video",
    category: "kpi",
    icon: Eye,
    preview: <KpiPreview value="6.8K" change="-2.1%" up={false} />,
  },
  {
    id: "content-velocity",
    name: "Content Velocity",
    description: "Posts per week/month",
    category: "kpi",
    icon: Gauge,
    preview: <KpiPreview value="4.2/wk" change="+0.8" />,
  },
  {
    id: "overview-metrics",
    name: "Overview Metrics",
    description: "Combined KPI card with key metrics",
    category: "kpi",
    icon: Activity,
    preview: (
      <div className="grid grid-cols-2 gap-1 w-full">
        {[
          { l: "Followers", v: "12.4K" },
          { l: "Plays", v: "847K" },
          { l: "Rate", v: "4.2%" },
          { l: "Velocity", v: "4.2/wk" },
        ].map((m) => (
          <div key={m.l} className="text-center">
            <div className="text-[7px] text-muted-foreground">{m.l}</div>
            <div className="text-[10px] font-bold">{m.v}</div>
          </div>
        ))}
      </div>
    ),
  },

  // --- Charts (7) ---
  {
    id: "engagement-trend",
    name: "Engagement Trends",
    description: "Area chart showing plays and likes over time",
    category: "chart",
    icon: TrendingUp,
    preview: <MiniAreaChart />,
  },
  {
    id: "engagement-breakdown",
    name: "Engagement Breakdown",
    description: "Breakdown of likes, comments, shares, saves",
    category: "chart",
    icon: PieChart,
    preview: (
      <MiniDonut
        slices={[
          { pct: 45, color: "hsl(var(--primary))" },
          { pct: 25, color: "hsl(var(--chart-2))" },
          { pct: 18, color: "hsl(var(--chart-3))" },
          { pct: 12, color: "hsl(var(--chart-4))" },
        ]}
      />
    ),
  },
  {
    id: "posting-frequency",
    name: "Posting Frequency",
    description: "Posts by day of week",
    category: "chart",
    icon: CalendarDays,
    preview: <MiniBarChart bars={[40, 65, 50, 80, 55, 35, 25]} />,
  },
  {
    id: "best-posting-times",
    name: "Best Posting Times",
    description: "Heatmap of optimal posting hours",
    category: "chart",
    icon: Clock,
    preview: <MiniHeatmap />,
  },
  {
    id: "growth-chart",
    name: "Growth Chart",
    description: "Follower growth trajectory over time",
    category: "chart",
    icon: LineChart,
    preview: <MiniLineChart />,
  },
  {
    id: "duration-performance",
    name: "Duration Performance",
    description: "Performance by video duration",
    category: "chart",
    icon: Timer,
    preview: <MiniBarChart bars={[90, 72, 55, 38, 20]} color="bg-blue-500/40" />,
  },
  {
    id: "views-distribution",
    name: "Views Distribution",
    description: "Histogram of video view counts",
    category: "chart",
    icon: BarChart3,
    preview: <MiniBarChart bars={[25, 45, 80, 65, 40, 20, 10]} color="bg-emerald-500/40" />,
  },

  // --- Content (4) ---
  {
    id: "top-content",
    name: "Top Content",
    description: "Grid of your top performing videos",
    category: "content",
    icon: Video,
    preview: <MiniThumbnailGrid />,
  },
  {
    id: "recent-posts",
    name: "Recent Posts",
    description: "List of your latest video posts",
    category: "content",
    icon: FileText,
    preview: <MiniPostList />,
  },
  {
    id: "viral-posts",
    name: "Viral Posts",
    description: "Videos exceeding share rate threshold",
    category: "content",
    icon: Flame,
    preview: <MiniPostList count={2} />,
  },
  {
    id: "underperforming",
    name: "Underperforming",
    description: "Videos below average engagement",
    category: "content",
    icon: AlertTriangle,
    preview: <MiniPostList count={2} />,
  },

  // --- Engagement (6) ---
  {
    id: "total-comments",
    name: "Total Comments",
    description: "Comment count with change over period",
    category: "engagement",
    icon: MessageSquare,
    preview: <KpiPreview value="1.2K" change="+14.3%" />,
  },
  {
    id: "saves-rate",
    name: "Saves Rate",
    description: "Saves as a percentage of plays",
    category: "engagement",
    icon: Bookmark,
    preview: <KpiPreview value="5.1%" change="+0.3%" />,
  },
  {
    id: "virality-score",
    name: "Virality Score",
    description: "Share-to-view ratio percentage",
    category: "engagement",
    icon: Share2,
    preview: <KpiPreview value="2.3%" change="+0.8%" />,
  },
  {
    id: "comments-per-post",
    name: "Comments / Post",
    description: "Average comments per video",
    category: "engagement",
    icon: MessageCircle,
    preview: <KpiPreview value="18" change="+2.4" />,
  },
  {
    id: "engagement-by-day",
    name: "Engagement by Day",
    description: "Engagement metrics by day of week",
    category: "engagement",
    icon: CalendarDays,
    preview: <MiniBarChart bars={[55, 70, 60, 85, 75, 40, 35]} color="bg-orange-500/40" />,
  },
  {
    id: "follower-engagement-ratio",
    name: "Follower Ratio",
    description: "Plays per follower ratio",
    category: "engagement",
    icon: Users,
    preview: <KpiPreview value="14.2x" change="+1.8" />,
  },

  // --- Comments (5) ---
  {
    id: "recent-comments",
    name: "Recent Comments",
    description: "Latest comments with post context",
    category: "comments",
    icon: MessageSquare,
    preview: <MiniCommentList />,
  },
  {
    id: "top-commenters",
    name: "Top Commenters",
    description: "Most active commenters on your videos",
    category: "comments",
    icon: Crown,
    preview: (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="size-5 rounded-full bg-muted flex items-center justify-center text-[7px] text-muted-foreground"
          >
            {i}
          </div>
        ))}
        <span className="text-[8px] text-muted-foreground ml-0.5">+12</span>
      </div>
    ),
  },
  {
    id: "comment-sentiment",
    name: "Comment Sentiment",
    description: "Sentiment analysis of your comments",
    category: "comments",
    icon: SmilePlus,
    preview: <MiniSentimentBars />,
  },
  {
    id: "comment-activity",
    name: "Comment Activity",
    description: "Comments over time trend",
    category: "comments",
    icon: Activity,
    preview: <MiniAreaChart />,
  },
  {
    id: "audience-loyalty",
    name: "Audience Loyalty",
    description: "Repeat vs one-time commenter ratio",
    category: "comments",
    icon: UserCheck,
    preview: (
      <MiniDonut
        slices={[
          { pct: 68, color: "hsl(var(--primary))" },
          { pct: 32, color: "hsl(var(--muted))" },
        ]}
      />
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Widget card rendered in the grid                                  */
/* ------------------------------------------------------------------ */

function WidgetShowcaseCard({ widget }: { widget: WidgetItem }) {
  const Icon = widget.icon;
  return (
    <div className="group relative flex flex-col rounded-xl border bg-card/50 p-3 transition-all hover:border-primary/50 hover:shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-muted">
          <Icon className="size-3.5 text-muted-foreground" />
        </div>
        <span className="text-xs font-medium leading-tight truncate">
          {widget.name}
        </span>
      </div>
      <div className="flex-1 flex items-center">{widget.preview}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                       */
/* ------------------------------------------------------------------ */

export function InteractiveQueries() {
  const [activeCategory, setActiveCategory] = useState<WidgetCategory>("all");
  const filteredWidgets =
    activeCategory === "all"
      ? ALL_WIDGETS
      : ALL_WIDGETS.filter((w) => w.category === activeCategory);

  return (
    <section className="border-y bg-muted/30 py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <AnimateOnScroll className="text-center mb-10">
          <Badge variant="secondary" className="mb-4">
            <LayoutGrid className="size-3" />
            {ALL_WIDGETS.length} Widgets
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Explore your analytics toolkit
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Build your perfect dashboard from {ALL_WIDGETS.length} purpose-built
            widgets spanning KPIs, charts, content analysis, engagement metrics,
            and comment insights.
          </p>
        </AnimateOnScroll>

        {/* Category tabs */}
        <AnimateOnScroll delay={100}>
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {CATEGORY_CONFIG.map(({ key, label, icon: CatIcon }) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition-colors ${
                  activeCategory === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <CatIcon className="size-3.5" />
                {label}
                {key !== "all" && (
                  <span className="ml-0.5 text-xs opacity-70">
                    {ALL_WIDGETS.filter((w) => w.category === key).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </AnimateOnScroll>

        {/* Widget grid */}
        <AnimateOnScroll delay={200}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 content-start max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredWidgets.map((widget) => (
              <WidgetShowcaseCard
                key={widget.id}
                widget={widget}
              />
            ))}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
