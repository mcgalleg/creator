import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";

interface ContentLayoutProps {
  children: React.ReactNode;
  badge?: {
    icon: LucideIcon;
    label: string;
  };
}

export function ContentLayout({ children, badge }: ContentLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Nav />
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-16">
          <div className="space-y-4 [&>hr+h2]:mt-0">
            {badge && (
              <Badge variant="secondary" className="gap-1.5">
                <badge.icon className="h-3.5 w-3.5" />
                {badge.label}
              </Badge>
            )}
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
