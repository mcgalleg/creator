"use client";

import { useState, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimateOnScroll } from "@/components/landing/animate-on-scroll";

/* ------------------------------------------------------------------ */
/*  Sample question definitions                                        */
/* ------------------------------------------------------------------ */

interface SampleQuestion {
  id: string;
  question: string;
  assistantText: string;
  visualization: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Visualization: Heatmap (Best Posting Times)                        */
/* ------------------------------------------------------------------ */

function HeatmapVisualization() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const timeSlots = ["6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"];
  // Engagement intensity per cell (0-1): rows = days, cols = time slots
  const data: number[][] = [
    [0.1, 0.3, 0.5, 0.4, 0.8, 0.6],
    [0.2, 0.4, 0.6, 0.5, 0.9, 0.7],
    [0.15, 0.35, 0.7, 0.6, 0.85, 0.55],
    [0.1, 0.3, 0.55, 0.5, 0.95, 0.8],
    [0.2, 0.5, 0.65, 0.45, 0.75, 0.5],
    [0.4, 0.6, 0.8, 0.7, 0.5, 0.35],
    [0.5, 0.7, 0.9, 0.65, 0.4, 0.25],
  ];

  return (
    <div className="w-full">
      {/* Column headers (time slots) */}
      <div className="grid gap-1.5 mb-2" style={{ gridTemplateColumns: "48px repeat(6, 1fr)" }}>
        <div />
        {timeSlots.map((t) => (
          <div key={t} className="text-[10px] sm:text-xs text-muted-foreground text-center font-medium">
            {t}
          </div>
        ))}
      </div>
      {/* Rows */}
      {days.map((day, di) => (
        <div
          key={day}
          className="grid gap-1.5 mb-1.5"
          style={{ gridTemplateColumns: "48px repeat(6, 1fr)" }}
        >
          <div className="text-[10px] sm:text-xs text-muted-foreground font-medium flex items-center">
            {day}
          </div>
          {data[di].map((intensity, ti) => (
            <div
              key={ti}
              className="aspect-[2/1] rounded-md bg-primary transition-colors"
              style={{ opacity: intensity * 0.85 + 0.1 }}
              title={`${day} ${timeSlots[ti]}: ${Math.round(intensity * 100)}% engagement`}
              aria-label={`${day} ${timeSlots[ti]}: ${Math.round(intensity * 100)}% engagement`}
              role="gridcell"
            />
          ))}
        </div>
      ))}
      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3">
        <span className="text-[10px] text-muted-foreground">Low</span>
        <div className="flex gap-0.5">
          {[0.15, 0.35, 0.55, 0.75, 0.95].map((v, i) => (
            <div
              key={i}
              className="w-4 h-2.5 rounded-sm bg-primary"
              style={{ opacity: v * 0.85 + 0.1 }}
            />
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground">High</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Visualization: Area Chart (Engagement Trends)                      */
/* ------------------------------------------------------------------ */

function AreaChartVisualization() {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const values = [2400, 3200, 2800, 4100, 3600, 4800, 5200];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  // Build SVG points for the area and line
  const width = 500;
  const height = 200;
  const padX = 0;
  const padTop = 10;
  const padBottom = 30;
  const chartH = height - padTop - padBottom;

  const points = values.map((v, i) => ({
    x: padX + (i / (values.length - 1)) * (width - padX * 2),
    y: padTop + chartH - ((v - min) / range) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${height - padBottom} L${points[0].x},${height - padBottom} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: "auto", maxHeight: 220 }} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Area chart showing engagement trends over the week with an upward trend">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padTop + chartH - pct * chartH;
          return (
            <line
              key={i}
              x1={padX}
              y1={y}
              x2={width - padX}
              y2={y}
              stroke="hsl(var(--muted-foreground))"
              strokeOpacity="0.1"
              strokeWidth="1"
            />
          );
        })}
        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGrad)" />
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="hsl(var(--primary))" />
            <circle cx={p.x} cy={p.y} r="2" fill="hsl(var(--background))" />
          </g>
        ))}
        {/* X-axis labels */}
        {labels.map((label, i) => (
          <text
            key={i}
            x={points[i].x}
            y={height - 8}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize="12"
          >
            {label}
          </text>
        ))}
      </svg>
      {/* Summary stats */}
      <div className="flex gap-6 mt-3">
        <div>
          <div className="text-[10px] text-muted-foreground">Peak Day</div>
          <div className="text-sm font-semibold">Sunday</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">Avg Engagement</div>
          <div className="text-sm font-semibold">3,743</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">Trend</div>
          <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">+18.2%</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Visualization: Top Commenters List                                 */
/* ------------------------------------------------------------------ */

function TopCommentersVisualization() {
  const commenters = [
    { name: "sarah_creates", comments: 47, color: "bg-pink-500" },
    { name: "mike.edits", comments: 38, color: "bg-blue-500" },
    { name: "tiktok_fan_99", comments: 31, color: "bg-purple-500" },
    { name: "daily.viewer", comments: 24, color: "bg-emerald-500" },
    { name: "content_lover", comments: 19, color: "bg-amber-500" },
  ];
  const maxComments = commenters[0].comments;

  return (
    <div className="w-full space-y-3">
      {commenters.map((c, i) => (
        <div key={c.name} className="flex items-center gap-3">
          {/* Rank */}
          <span className="text-xs text-muted-foreground font-medium w-4 text-right shrink-0">
            {i + 1}
          </span>
          {/* Avatar */}
          <div
            className={`size-8 rounded-full ${c.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}
          >
            {c.name[0].toUpperCase()}
          </div>
          {/* Name and bar */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium truncate">{c.name}</span>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                {c.comments} comments
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${c.color} transition-all`}
                style={{ width: `${(c.comments / maxComments) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Visualization: Sentiment Donut Chart                               */
/* ------------------------------------------------------------------ */

function SentimentDonutVisualization() {
  const segments = [
    { label: "Positive", pct: 72, color: "hsl(152, 69%, 45%)", dotClass: "bg-emerald-500" },
    { label: "Neutral", pct: 20, color: "hsl(217, 71%, 53%)", dotClass: "bg-blue-500" },
    { label: "Negative", pct: 8, color: "hsl(0, 72%, 51%)", dotClass: "bg-red-500" },
  ];

  // Build cumulative offsets
  const offsets = segments.reduce<number[]>(
    (acc, _, i) => [...acc, i === 0 ? 0 : acc[i - 1] + segments[i - 1].pct],
    []
  );

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
      {/* Donut */}
      <div className="relative shrink-0">
        <svg viewBox="0 0 120 120" className="w-40 h-40 sm:w-48 sm:h-48" role="img" aria-label="Donut chart showing comment sentiment: 72% positive, 20% neutral, 8% negative">
          {segments.map((s, i) => (
            <circle
              key={i}
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${(s.pct / 100) * 301.6} ${301.6}`}
              strokeDashoffset={-(offsets[i] / 100) * 301.6}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              className="transition-all"
            />
          ))}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">72%</span>
          <span className="text-[10px] text-muted-foreground">Positive</span>
        </div>
      </div>
      {/* Legend */}
      <div className="space-y-3 flex-1 min-w-0">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className={`size-3 rounded-full ${s.dotClass} shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{s.label}</span>
                <span className="text-sm font-bold">{s.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full ${s.dotClass}`}
                  style={{ width: `${s.pct}%` }}
                />
              </div>
            </div>
          </div>
        ))}
        <div className="pt-2 border-t">
          <div className="text-[10px] text-muted-foreground">Based on 1,247 analyzed comments</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Visualization: Top Performing Videos Grid                          */
/* ------------------------------------------------------------------ */

function TopVideosVisualization() {
  const videos = [
    {
      title: "Morning routine that changed everything",
      views: "1.2M",
      likes: "89.4K",
      comments: "2.3K",
      shares: "12.1K",
      color: "from-pink-500/20 to-purple-500/20",
    },
    {
      title: "3 tips for better lighting on a budget",
      views: "847K",
      likes: "62.1K",
      comments: "1.8K",
      shares: "8.4K",
      color: "from-blue-500/20 to-cyan-500/20",
    },
    {
      title: "POV: when the algorithm finally hits",
      views: "623K",
      likes: "51.2K",
      comments: "1.4K",
      shares: "6.7K",
      color: "from-amber-500/20 to-orange-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
      {videos.map((v, i) => (
        <div
          key={i}
          className="rounded-xl border bg-card/80 overflow-hidden flex flex-col"
        >
          {/* Thumbnail placeholder */}
          <div
            className={`aspect-video bg-gradient-to-br ${v.color} flex items-center justify-center relative`}
          >
            <div className="size-10 rounded-full bg-background/80 flex items-center justify-center" role="img" aria-label="Video thumbnail">
              <div className="w-0 h-0 border-l-[8px] border-l-foreground border-y-[6px] border-y-transparent ml-0.5" aria-hidden="true" />
            </div>
            <div className="absolute top-2 left-2 text-[10px] font-bold bg-background/70 rounded px-1.5 py-0.5">
              #{i + 1}
            </div>
          </div>
          {/* Info */}
          <div className="p-3 flex-1 flex flex-col">
            <p className="text-xs font-medium leading-snug line-clamp-2 mb-2">
              {v.title}
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-auto">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Views</span>
                <span className="text-[10px] font-semibold">{v.views}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Likes</span>
                <span className="text-[10px] font-semibold">{v.likes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Comments</span>
                <span className="text-[10px] font-semibold">{v.comments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Shares</span>
                <span className="text-[10px] font-semibold">{v.shares}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Visualization: Bar Chart (Posting Frequency)                       */
/* ------------------------------------------------------------------ */

function PostingFrequencyVisualization() {
  const days = [
    { label: "Mon", posts: 4 },
    { label: "Tue", posts: 7 },
    { label: "Wed", posts: 5 },
    { label: "Thu", posts: 9 },
    { label: "Fri", posts: 6 },
    { label: "Sat", posts: 3 },
    { label: "Sun", posts: 2 },
  ];
  const maxPosts = Math.max(...days.map((d) => d.posts));

  return (
    <div className="w-full">
      {/* Y-axis + bars container */}
      <div className="flex gap-2">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between h-48 py-1 shrink-0">
          {[maxPosts, Math.round(maxPosts * 0.75), Math.round(maxPosts * 0.5), Math.round(maxPosts * 0.25), 0].map(
            (v, i) => (
              <span key={i} className="text-[10px] text-muted-foreground text-right w-4">
                {v}
              </span>
            )
          )}
        </div>
        {/* Bars */}
        <div className="flex-1 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-muted-foreground/10 w-full" />
            ))}
          </div>
          {/* Bar group */}
          <div className="flex items-end gap-2 sm:gap-4 h-48 relative z-10 px-1">
            {days.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center">
                <div className="w-full flex justify-center" style={{ height: 192 }}>
                  <div
                    className="w-full max-w-10 rounded-t-md bg-primary/80 hover:bg-primary transition-colors relative group"
                    style={{
                      height: `${(d.posts / maxPosts) * 100}%`,
                      alignSelf: "flex-end",
                    }}
                    role="img"
                    aria-label={`${d.label}: ${d.posts} posts`}
                  >
                    {/* Value tooltip on hover */}
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
                      {d.posts}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* X-axis labels */}
      <div className="flex gap-2">
        <div className="w-4 shrink-0" />
        <div className="flex-1 flex gap-2 sm:gap-4 px-1">
          {days.map((d) => (
            <div key={d.label} className="flex-1 text-center">
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                {d.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Summary */}
      <div className="flex gap-6 mt-4">
        <div>
          <div className="text-[10px] text-muted-foreground">Total Posts</div>
          <div className="text-sm font-semibold">36</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">Most Active</div>
          <div className="text-sm font-semibold">Thursday</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">Avg / Day</div>
          <div className="text-sm font-semibold">5.1</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Question definitions                                               */
/* ------------------------------------------------------------------ */

const SAMPLE_QUESTIONS: SampleQuestion[] = [
  {
    id: "posting-times",
    question: "What are my best posting times?",
    assistantText:
      "Based on your last 90 days of data, your highest engagement happens on weekends in the morning and weekday evenings around 6-9 PM. Here's the full breakdown:",
    visualization: <HeatmapVisualization />,
  },
  {
    id: "engagement-trends",
    question: "Show my engagement trends",
    assistantText:
      "Your engagement has been trending upward over the past week, with a notable spike heading into the weekend. Sunday was your strongest day at 5,200 interactions.",
    visualization: <AreaChartVisualization />,
  },
  {
    id: "top-commenters",
    question: "Who are my top commenters?",
    assistantText:
      "Here are your most active community members. sarah_creates has been your top commenter with 47 comments in the last 30 days:",
    visualization: <TopCommentersVisualization />,
  },
  {
    id: "comment-sentiment",
    question: "How is my comment sentiment?",
    assistantText:
      "Great news! The vast majority of your comments are positive. Only 8% of comments carry negative sentiment, which is well below the platform average of 15%.",
    visualization: <SentimentDonutVisualization />,
  },
  {
    id: "top-videos",
    question: "Show my top performing videos",
    assistantText:
      "Your top 3 videos by total views. Your morning routine video is a clear standout, nearly hitting the million-view mark:",
    visualization: <TopVideosVisualization />,
  },
  {
    id: "posting-frequency",
    question: "What's my posting frequency?",
    assistantText:
      "You've posted 36 times in the last week, averaging about 5 posts per day. Thursday is your most active day with 9 posts.",
    visualization: <PostingFrequencyVisualization />,
  },
];

/* ------------------------------------------------------------------ */
/*  Chat bubble components                                             */
/* ------------------------------------------------------------------ */

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="rounded-2xl rounded-br-md bg-primary/10 px-4 py-2.5 max-w-[85%]">
        <p className="text-sm font-medium">{text}</p>
      </div>
    </div>
  );
}

function AssistantBubble({
  text,
  visualization,
}: {
  text: string;
  visualization: ReactNode;
}) {
  return (
    <div className="flex justify-start">
      <div className="max-w-full w-full">
        {/* Text portion */}
        <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 mb-3">
          <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
        </div>
        {/* Visualization card */}
        <div className="rounded-xl border bg-card p-4 sm:p-5">
          {visualization}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main exported component                                            */
/* ------------------------------------------------------------------ */

export function SampleQuestions() {
  const [activeId, setActiveId] = useState<string>(SAMPLE_QUESTIONS[0].id);
  const activeQuestion = SAMPLE_QUESTIONS.find((q) => q.id === activeId)!;

  return (
    <section className="border-y bg-muted/30 py-24">
      <div className="container mx-auto max-w-5xl px-4">
        {/* Header */}
        <AnimateOnScroll className="text-center mb-10">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="size-3" />
            AI-Powered
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            See it in action
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Ask a question, get a visualization. Here&apos;s what your AI copilot
            can do with your TikTok data.
          </p>
        </AnimateOnScroll>

        {/* Question pills */}
        <AnimateOnScroll delay={100}>
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {SAMPLE_QUESTIONS.map((q) => (
              <button
                key={q.id}
                onClick={() => setActiveId(q.id)}
                className={`rounded-full px-4 py-2 text-sm transition-colors cursor-pointer ${
                  activeId === q.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                }`}
              >
                {q.question}
              </button>
            ))}
          </div>
        </AnimateOnScroll>

        {/* Chat bubble UI */}
        <AnimateOnScroll delay={200}>
          <div className="rounded-2xl border bg-background/80 backdrop-blur-sm p-4 sm:p-6 shadow-sm max-w-4xl mx-auto">
            {/* Chat header bar */}
            <div className="flex items-center gap-2 mb-5 pb-4 border-b">
              <div className="size-7 rounded-full bg-primary/15 flex items-center justify-center">
                <Sparkles className="size-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium">AI Copilot</span>
              <span className="size-2 rounded-full bg-emerald-500 ml-1" aria-hidden="true" />
            </div>

            {/* Messages */}
            <div className="space-y-4">
              <UserBubble text={activeQuestion.question} />
              <AssistantBubble
                text={activeQuestion.assistantText}
                visualization={activeQuestion.visualization}
              />
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
