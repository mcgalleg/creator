import Link from "next/link";
import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s — Astriq Docs",
    default: "Documentation — Astriq",
  },
  description: "Learn how to get the most out of Astriq — guides, tutorials, and reference docs.",
};

const sidebarLinks = [
  { href: "/docs", label: "Overview" },
  { href: "/docs/getting-started", label: "Getting Started" },
  { href: "/docs/ai-copilot", label: "AI Copilot" },
  { href: "/docs/sync-credits", label: "Sync Credits" },
  { href: "/docs/ai-tokens", label: "AI Tokens" },
  { href: "/docs/accounts", label: "Managing Accounts" },
  { href: "/docs/connectors", label: "Connectors" },
  { href: "/docs/billing", label: "Billing & Plans" },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Nav />
      <div className="container mx-auto flex max-w-6xl flex-1 gap-8 px-4 py-16">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-24 space-y-1">
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Documentation
            </Badge>
            <nav className="space-y-1">
              {sidebarLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">
          <div className="max-w-3xl space-y-4 [&>hr+h2]:mt-0">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
