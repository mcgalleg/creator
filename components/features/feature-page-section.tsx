import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeaturePageSectionProps {
  icon: LucideIcon;
  heading: string;
  children: React.ReactNode;
  reverse?: boolean;
}

export function FeaturePageSection({
  icon: Icon,
  heading,
  children,
  reverse,
}: FeaturePageSectionProps) {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div
            className={cn(
              "flex items-center justify-center",
              reverse && "md:order-last"
            )}
          >
            <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10">
              <Icon className="size-10 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{heading}</h2>
            <div className="mt-4 text-muted-foreground leading-relaxed">
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
