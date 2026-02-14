import { Link, RefreshCw, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimateOnScroll } from "@/components/landing/animate-on-scroll";

const steps = [
  {
    icon: Link,
    number: "1",
    title: "Connect",
    description:
      "Link your social accounts in one click. We support Instagram, YouTube, TikTok, and more.",
  },
  {
    icon: RefreshCw,
    number: "2",
    title: "Sync",
    description:
      "Choose a sync strategy — manual, scheduled, or real-time — and we pull your data automatically.",
  },
  {
    icon: TrendingUp,
    number: "3",
    title: "Ask & Discover",
    description:
      "Chat with your data, build dashboards, and uncover insights you never knew existed.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            How It Works
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Up and running in minutes
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to transform your social data into actionable
            insights.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Gradient connector line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-primary/50 via-primary/30 to-primary/50" />

          {steps.map((step, i) => (
            <AnimateOnScroll key={step.number} delay={i * 100}>
              <div className="relative flex flex-col items-center text-center">
                {/* Step circle with icon */}
                <div className="relative mb-6">
                  <div className="size-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                    <step.icon className="size-8 text-primary" />
                  </div>
                  {/* Number badge */}
                  <div className="absolute -top-1 -right-1 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm">
                    {step.number}
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {step.description}
                </p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
