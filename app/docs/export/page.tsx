import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exporting — Astriq",
  description:
    "Export analytics as PDF reports or CSV data files from the Dashboard and Canvas.",
};

export default function ExportPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <Badge variant="secondary">
          <Download className="size-3" />
          Exporting
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Exporting</h1>
        <p className="text-lg text-muted-foreground">
          Take your analytics offline or share them with your team. Export data
          from both the Dashboard and Canvas in multiple formats.
        </p>
      </div>

      {/* Export Types */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">PDF Export</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generate polished PDF reports from your dashboard layout or canvas
              boards. Perfect for presentations, client reports, or archiving
              your analytics.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">CSV Export</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Download raw data as CSV files for further analysis in spreadsheets
              or BI tools. Export video metrics, comment data, engagement
              history, and more.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
