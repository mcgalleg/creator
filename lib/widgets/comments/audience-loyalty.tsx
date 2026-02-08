"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  widgetRegistry,
  type WidgetProps,
  type WidgetDefinition,
} from "../registry";

interface AudienceLoyaltyWidgetProps extends WidgetProps {
  data?: {
    loyaltyRate: number;
    repeat: number;
    oneTime: number;
    total: number;
  } | null;
  isLoading?: boolean;
}

function AudienceLoyaltyWidgetSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-36" />
        </div>
      </CardContent>
    </Card>
  );
}

function AudienceLoyaltyWidgetEmpty() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Audience Loyalty
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Heart className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">No data available</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AudienceLoyaltyWidget({
  data = null,
  isLoading = false,
}: AudienceLoyaltyWidgetProps) {
  if (isLoading) {
    return <AudienceLoyaltyWidgetSkeleton />;
  }

  if (!data) {
    return <AudienceLoyaltyWidgetEmpty />;
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Heart className="h-4 w-4" />
          Audience Loyalty
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold">
            {data.loyaltyRate.toFixed(1)}%
          </span>
          <p className="text-xs text-muted-foreground">
            {data.repeat} repeat vs {data.oneTime} one-time commenters
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.total} unique commenters total
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export const audienceLoyaltyWidgetDefinition: WidgetDefinition = {
  id: "audience-loyalty",
  name: "Audience Loyalty",
  description: "Percentage of repeat commenters showing audience loyalty",
  category: "comments",
  icon: Heart,
  component: AudienceLoyaltyWidget,
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 3 },
  dataRequirements: [
    {
      type: "comments",
      fields: ["commentCount"],
    },
  ],
};

// Register the widget
widgetRegistry.register(audienceLoyaltyWidgetDefinition);

export { AudienceLoyaltyWidget };
