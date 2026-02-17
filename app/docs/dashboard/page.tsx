import { Badge } from "@/components/ui/badge";
import { LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Not a Bot",
  description:
    "Your command center for TikTok analytics with drag-and-drop widgets and customizable layouts.",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <Badge variant="secondary">
          <LayoutDashboard className="size-3" />
          Dashboard
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Your command center for TikTok analytics. The dashboard provides a
          fully customizable view of your content performance with drag-and-drop
          widgets.
        </p>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Drag-and-Drop Widgets</h2>
          <p className="text-sm text-muted-foreground">
            Choose from over 30 widgets to build the perfect dashboard for your
            needs. Widgets cover engagement metrics, follower growth, video
            performance, comment trends, and more. Drag them into any position
            and resize to create your ideal layout.
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Customizable Layout</h2>
          <p className="text-sm text-muted-foreground">
            Arrange widgets in a responsive grid that adapts to your screen
            size. Save multiple layout configurations and switch between them.
            Your layout preferences persist across sessions.
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Real-Time Data</h2>
          <p className="text-sm text-muted-foreground">
            Dashboard widgets update automatically after each sync. View live
            engagement rates, trending videos, audience demographics, and
            performance comparisons — all in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
