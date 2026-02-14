import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimateOnScroll } from "@/components/landing/animate-on-scroll";

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
      </div>

      <div className="p-4 space-y-4">
        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
            <div className="text-xs text-muted-foreground mb-1">Followers</div>
            <div className="text-lg font-bold">12.4K</div>
          </div>
          <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-3">
            <div className="text-xs text-muted-foreground mb-1">
              Engagement
            </div>
            <div className="text-lg font-bold">4.2%</div>
          </div>
          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3">
            <div className="text-xs text-muted-foreground mb-1">Reach</div>
            <div className="text-lg font-bold">89K</div>
          </div>
          <div className="rounded-lg bg-orange-500/5 border border-orange-500/10 p-3">
            <div className="text-xs text-muted-foreground mb-1">Posts</div>
            <div className="text-lg font-bold">148</div>
          </div>
        </div>

        {/* Bar chart */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="text-xs text-muted-foreground mb-3">
            Weekly engagement
          </div>
          <div className="flex items-end gap-2 h-20">
            {[45, 65, 40, 80, 55, 70, 60].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary/40"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {["M", "T", "W", "T", "F", "S", "S"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CanvasMockup() {
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden [transform:perspective(1200px)_rotateY(2deg)] transition-transform hover:[transform:perspective(1200px)_rotateY(0deg)]">
      {/* Header bar */}
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-red-400/60" />
          <div className="size-2.5 rounded-full bg-yellow-400/60" />
          <div className="size-2.5 rounded-full bg-green-400/60" />
        </div>
        <div className="text-xs text-muted-foreground ml-2">Canvas</div>
      </div>

      <div className="relative h-56 bg-[radial-gradient(circle,_var(--border)_1px,_transparent_1px)] bg-[size:16px_16px] p-4">
        {/* Sticky notes */}
        <div className="absolute top-4 left-4 w-28 rounded-lg bg-yellow-400/15 border border-yellow-400/25 p-2 shadow-sm">
          <div className="text-[10px] font-medium text-yellow-700 dark:text-yellow-400">
            Top Post Ideas
          </div>
          <div className="h-1 w-16 rounded bg-yellow-500/30 mt-1" />
          <div className="h-1 w-12 rounded bg-yellow-500/20 mt-1" />
        </div>

        <div className="absolute top-6 right-6 w-24 rounded-lg bg-blue-400/15 border border-blue-400/25 p-2 shadow-sm">
          <div className="text-[10px] font-medium text-blue-700 dark:text-blue-400">
            Audience Notes
          </div>
          <div className="h-1 w-14 rounded bg-blue-500/30 mt-1" />
        </div>

        <div className="absolute bottom-16 left-8 w-24 rounded-lg bg-emerald-400/15 border border-emerald-400/25 p-2 shadow-sm">
          <div className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
            KPIs
          </div>
          <div className="h-1 w-14 rounded bg-emerald-500/30 mt-1" />
        </div>

        {/* Pinned chart */}
        <div className="absolute bottom-4 right-4 w-32 rounded-lg border bg-card/80 backdrop-blur-sm p-2 shadow-sm">
          <div className="text-[10px] text-muted-foreground mb-1">
            Pinned chart
          </div>
          <div className="flex items-end gap-0.5 h-10">
            {[50, 70, 40, 85, 60, 75, 55].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-primary/30"
                style={{ height: `${h}%` }}
              />
            ))}
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
  "Pin charts from chat or dashboard",
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
            <DashboardMockup />
          </div>
        </AnimateOnScroll>

        {/* Row 2: Canvas (reversed) */}
        <AnimateOnScroll>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <CanvasMockup />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Pin, arrange, and explore
                </h3>
                <Badge variant="secondary">Creator & Pro</Badge>
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
