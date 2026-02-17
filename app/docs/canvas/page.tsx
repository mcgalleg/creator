import { Badge } from "@/components/ui/badge";
import { Paintbrush } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canvas Workspace — Not a Bot",
  description:
    "An infinite canvas for visual data exploration, brainstorming, and content strategy planning.",
};

export default function CanvasPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <Badge variant="secondary">
          <Paintbrush className="size-3" />
          Canvas Workspace
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          Canvas Workspace
        </h1>
        <p className="text-lg text-muted-foreground">
          An infinite canvas for visual data exploration and brainstorming.
          Combine analytics with freeform creativity to plan content strategies
          and present findings.
        </p>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Infinite Canvas</h2>
          <p className="text-sm text-muted-foreground">
            Pan, zoom, and scroll across an unlimited workspace. Organize your
            ideas spatially without any boundaries. The canvas supports smooth
            navigation at any zoom level.
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Drawing Tools</h2>
          <p className="text-sm text-muted-foreground">
            Add shapes, sticky notes, text boxes, arrows, and freehand drawings.
            Use these tools to annotate data, create flowcharts, or build visual
            content calendars.
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Visual Data Exploration</h2>
          <p className="text-sm text-muted-foreground">
            Drag charts and analytics widgets directly onto the canvas. Arrange
            data visualizations alongside notes and annotations to build
            comprehensive analysis boards.
          </p>
        </div>
      </div>
    </div>
  );
}
