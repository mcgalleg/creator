import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimateOnScroll } from "@/components/landing/animate-on-scroll";
import { DashboardShowcaseMockup } from "./dashboard-showcase-mockup";
import { CanvasShowcaseInteractiveMockup } from "./canvas-showcase-interactive-mockup";

function DashboardMockup() {
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden [transform:perspective(1200px)_rotateY(-2deg)] transition-transform hover:[transform:perspective(1200px)_rotateY(0deg)]">
      {/* Header bar */}
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-red-400/60" />
          <div className="size-2.5 rounded-full bg-yellow-400/60" />
          <div className="size-2.5 rounded-full bg-green-400/60" />
        </div>
        <div className="text-xs text-muted-foreground ml-2">Dashboard</div>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-5 w-14 rounded bg-muted text-[9px] flex items-center justify-center text-muted-foreground">
            30d
          </div>
          <div className="size-5 rounded bg-primary/10 flex items-center justify-center">
            <div className="size-2.5 text-primary">+</div>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* KPI widget row - mimics actual widget cards */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Followers", value: "12.4K", change: "+3.2%", up: true },
            { label: "Total Plays", value: "847K", change: "+8.1%", up: true },
            { label: "Engagement", value: "4.2%", change: "+0.5%", up: true },
            { label: "Avg Views", value: "6.8K", change: "-2.1%", up: false },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg border bg-card p-2"
            >
              <div className="text-[9px] text-muted-foreground mb-0.5">
                {kpi.label}
              </div>
              <div className="text-sm font-bold leading-tight">{kpi.value}</div>
              <div
                className={`text-[9px] font-medium ${
                  kpi.up
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {kpi.change}
              </div>
            </div>
          ))}
        </div>

        {/* Engagement trend area chart */}
        <div className="rounded-lg border bg-card p-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-medium">Engagement Trends</div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1">
                <div className="size-1.5 rounded-full bg-primary" />
                <span className="text-[8px] text-muted-foreground">Plays</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="size-1.5 rounded-full bg-blue-500" />
                <span className="text-[8px] text-muted-foreground">Likes</span>
              </div>
            </div>
          </div>
          <div className="relative h-16">
            <svg
              viewBox="0 0 200 60"
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0,45 C20,42 40,30 60,35 C80,40 100,20 120,25 C140,30 160,15 180,10 L200,12 L200,60 L0,60Z"
                className="fill-primary/10"
              />
              <path
                d="M0,45 C20,42 40,30 60,35 C80,40 100,20 120,25 C140,30 160,15 180,10 L200,12"
                className="stroke-primary"
                fill="none"
                strokeWidth="1.5"
              />
              <path
                d="M0,50 C20,48 40,40 60,42 C80,44 100,32 120,35 C140,38 160,28 180,22 L200,25 L200,60 L0,60Z"
                className="fill-blue-500/10"
              />
              <path
                d="M0,50 C20,48 40,40 60,42 C80,44 100,32 120,35 C140,38 160,28 180,22 L200,25"
                className="stroke-blue-500"
                fill="none"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>

        {/* Bottom row: posting frequency + sentiment */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border bg-card p-2">
            <div className="text-[10px] font-medium mb-1.5">
              Posts by Day
            </div>
            <div className="flex items-end gap-1 h-10">
              {[
                { d: "M", h: 40 },
                { d: "T", h: 65 },
                { d: "W", h: 50 },
                { d: "T", h: 80 },
                { d: "F", h: 55 },
                { d: "S", h: 35 },
                { d: "S", h: 25 },
              ].map((bar, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-0.5"
                >
                  <div
                    className="w-full rounded-sm bg-primary/40"
                    style={{ height: `${bar.h}%` }}
                  />
                  <span className="text-[7px] text-muted-foreground">
                    {bar.d}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-2">
            <div className="text-[10px] font-medium mb-1.5">Sentiment</div>
            <div className="space-y-1">
              {[
                { label: "Positive", pct: 72, color: "bg-emerald-500" },
                { label: "Neutral", pct: 20, color: "bg-blue-400" },
                { label: "Negative", pct: 8, color: "bg-red-400" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className="text-[7px] text-muted-foreground w-8 shrink-0">
                    {s.label}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.color}`}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


const dashboardFeatures = [
  "Drag-and-drop widget layout",
  "30+ analytics widgets",
  "Custom date-range filtering",
  "Multi-account switching",
];

const canvasFeatures = [
  "Freeform infinite canvas",
  "Drag shapes, text, and drawings",
  "Color-coded sticky notes",
  "Export canvas as image",
];

export function Showcase() {
  return (
    <section className="border-y bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-24 space-y-16">
        {/* Row 1: Dashboard */}
        <AnimateOnScroll>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold tracking-tight sm:text-3xl mb-4">
                Your analytics, your way
              </h3>
              <ul className="space-y-3">
                {dashboardFeatures.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 text-muted-foreground"
                  >
                    <Check className="size-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <DashboardShowcaseMockup />
          </div>
        </AnimateOnScroll>

        {/* Row 2: Canvas (reversed) */}
        <AnimateOnScroll>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <CanvasShowcaseInteractiveMockup />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Sketch, arrange, and explore
                </h3>
                <Badge variant="secondary">Pro</Badge>
              </div>
              <ul className="space-y-3">
                {canvasFeatures.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 text-muted-foreground"
                  >
                    <Check className="size-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
