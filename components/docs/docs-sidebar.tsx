"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Rocket,
  LayoutDashboard,
  Bot,
  Paintbrush,
  MessageSquare,
  Plug,
  Palette,
  Download,
  RefreshCw,
  Users,
  CreditCard,
  Coins,
  Menu,
  X,
  Search,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Getting Started",
    items: [
      { title: "Overview", href: "/docs", icon: BookOpen },
      { title: "Getting Started", href: "/docs/getting-started", icon: Rocket },
    ],
  },
  {
    label: "Features",
    items: [
      { title: "Dashboard", href: "/docs/dashboard", icon: LayoutDashboard },
      { title: "AI Copilot", href: "/docs/ai-copilot", icon: Bot },
      { title: "Canvas", href: "/docs/canvas", icon: Paintbrush },
      {
        title: "Comment Analysis",
        href: "/docs/comments",
        icon: MessageSquare,
      },
      { title: "MCP Apps", href: "/docs/mcp", icon: Plug },
      { title: "Themes", href: "/docs/themes", icon: Palette },
      { title: "Exporting", href: "/docs/export", icon: Download },
    ],
  },
  {
    label: "Data & Sync",
    items: [
      { title: "Syncing Data", href: "/docs/syncing", icon: RefreshCw },
      { title: "Multi-Account", href: "/docs/accounts", icon: Users },
    ],
  },
  {
    label: "Billing",
    items: [
      { title: "Plans & Pricing", href: "/docs/pricing", icon: CreditCard },
      { title: "Credit Packs", href: "/docs/credits", icon: Coins },
    ],
  },
];

// Flat list of all items for search
const ALL_ITEMS = NAV_SECTIONS.flatMap((s) =>
  s.items.map((item) => ({ ...item, section: s.label }))
);

export function DocsSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredSections = useMemo(() => {
    if (!query.trim()) return NAV_SECTIONS;
    const q = query.toLowerCase();
    const matches = ALL_ITEMS.filter((item) =>
      item.title.toLowerCase().includes(q)
    );
    if (matches.length === 0) return [];
    // Group matches back into sections
    const grouped = new Map<string, typeof matches>();
    for (const item of matches) {
      const arr = grouped.get(item.section) ?? [];
      arr.push(item);
      grouped.set(item.section, arr);
    }
    return Array.from(grouped.entries()).map(([label, items]) => ({
      label,
      items,
    }));
  }, [query]);

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="outline"
        size="icon-sm"
        className="fixed bottom-4 right-4 z-50 lg:hidden shadow-lg"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close navigation" : "Open navigation"}
      >
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </Button>

      {/* Backdrop for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 shrink-0 border-r bg-background pt-16 lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100vh-4rem)] lg:pt-0 transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <nav className="h-full overflow-y-auto px-3 py-6">
          {/* Search */}
          <div className="relative mb-4 px-1">
            <Search className="absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search docs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-md border bg-muted/50 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {filteredSections.length === 0 && query.trim() && (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}

          {filteredSections.map((section) => (
            <div key={section.label} className="mb-6">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => { setOpen(false); setQuery(""); }}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
