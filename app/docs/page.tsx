import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowRight,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — Astriq",
  description:
    "Learn how to use Astriq — AI-powered TikTok analytics for creators and brands.",
};

const DOC_SECTIONS = [
  {
    label: "Getting Started",
    items: [
      {
        title: "Getting Started",
        description:
          "Create your account, connect TikTok, and run your first sync.",
        href: "/docs/getting-started",
        icon: Rocket,
      },
    ],
  },
  {
    label: "Features",
    items: [
      {
        title: "Dashboard",
        description:
          "Drag-and-drop widgets, customizable layouts, and real-time data.",
        href: "/docs/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "AI Copilot",
        description:
          "Ask questions about your data in plain English and get chart responses.",
        href: "/docs/ai-copilot",
        icon: Bot,
      },
      {
        title: "Canvas",
        description:
          "Infinite workspace for visual data exploration and brainstorming.",
        href: "/docs/canvas",
        icon: Paintbrush,
      },
      {
        title: "Comment Analysis",
        description:
          "AI-powered sentiment analysis and theme detection across comments.",
        href: "/docs/comments",
        icon: MessageSquare,
      },
      {
        title: "MCP Apps",
        description:
          "Connect Claude Desktop, ChatGPT, or any MCP-compatible AI client.",
        href: "/docs/mcp",
        icon: Plug,
      },
      {
        title: "Themes",
        description:
          "17 color palettes with light and dark mode support.",
        href: "/docs/themes",
        icon: Palette,
      },
      {
        title: "Exporting",
        description:
          "Export analytics as PDF reports or CSV data files.",
        href: "/docs/export",
        icon: Download,
      },
    ],
  },
  {
    label: "Data & Sync",
    items: [
      {
        title: "Syncing Data",
        description:
          "Full, incremental, and quick sync options with credit costs.",
        href: "/docs/syncing",
        icon: RefreshCw,
      },
      {
        title: "Multi-Account",
        description:
          "Manage multiple TikTok accounts from a single dashboard.",
        href: "/docs/accounts",
        icon: Users,
      },
    ],
  },
  {
    label: "Billing",
    items: [
      {
        title: "Plans & Pricing",
        description:
          "Compare Creator and Pro plans with features and pricing.",
        href: "/docs/pricing",
        icon: CreditCard,
      },
      {
        title: "Credit Packs",
        description:
          "Purchase additional sync credits in packs of 100 to 1,500.",
        href: "/docs/credits",
        icon: Coins,
      },
    ],
  },
];

export default function DocsOverviewPage() {
  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div className="space-y-4">
        <Badge variant="secondary">
          <BookOpen className="size-3" />
          Documentation
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
        <p className="text-lg text-muted-foreground">
          Everything you need to know about using Astriq — from getting
          started to advanced features. Learn how to unlock AI-powered insights
          for your TikTok content.
        </p>
      </div>

      {/* Section grids */}
      {DOC_SECTIONS.map((section) => (
        <div key={section.label} className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {section.label}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="group">
                  <Card className="h-full transition-colors group-hover:border-primary/40">
                    <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="size-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-1.5">
                          {item.title}
                          <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="-mt-2">
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
