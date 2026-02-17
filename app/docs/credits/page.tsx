import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Credit Packs — Not a Bot",
  description:
    "Purchase additional sync credit packs from 100 to 1,500 credits. Credits never expire.",
};

export default function CreditsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <Badge variant="secondary">
          <Coins className="size-3" />
          Credit Packs
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Credit Packs</h1>
        <p className="text-lg text-muted-foreground">
          Need more sync credits? Purchase additional credit packs at any time.
          Larger packs offer a better per-credit rate. Credits never expire once
          purchased.
        </p>
      </div>

      {/* Packs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Starter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold">$4.99</p>
            <p className="text-sm text-muted-foreground">100 credits</p>
            <p className="text-xs text-muted-foreground">$0.050 per credit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Value</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold">$9.99</p>
            <p className="text-sm text-muted-foreground">300 credits</p>
            <p className="text-xs text-muted-foreground">$0.033 per credit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Power</CardTitle>
              <Badge variant="secondary" className="text-xs">
                Best Value
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold">$19.99</p>
            <p className="text-sm text-muted-foreground">750 credits</p>
            <p className="text-xs text-muted-foreground">$0.027 per credit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bulk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold">$34.99</p>
            <p className="text-sm text-muted-foreground">1,500 credits</p>
            <p className="text-xs text-muted-foreground">$0.023 per credit</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
