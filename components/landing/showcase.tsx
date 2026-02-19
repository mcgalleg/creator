import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimateOnScroll } from "@/components/landing/animate-on-scroll";
import { DashboardShowcaseMockup } from "./dashboard-showcase-mockup";
import { CanvasShowcaseInteractiveMockup } from "./canvas-showcase-interactive-mockup";

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
