"use client";

import { useState } from "react";
import {
  BarChart3,
  Lightbulb,
  Users,
  TrendingUp,
  Handshake,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GOALS } from "@/lib/prompt-catalog";
import { toast } from "sonner";

const ICON_MAP: Record<string, LucideIcon> = {
  "bar-chart-3": BarChart3,
  lightbulb: Lightbulb,
  users: Users,
  "trending-up": TrendingUp,
  handshake: Handshake,
  "share-2": Share2,
};

interface GoalsTabProps {
  initialGoals: string[];
}

export function GoalsTab({ initialGoals }: GoalsTabProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialGoals)
  );
  const [saving, setSaving] = useState(false);

  const toggle = (categoryName: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  const hasChanges = (() => {
    const initial = new Set(initialGoals);
    if (selected.size !== initial.size) return true;
    for (const g of selected) {
      if (!initial.has(g)) return true;
    }
    return false;
  })();

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: Array.from(selected) }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Goals updated — suggestions will refresh on your next visit.");
    } catch {
      toast.error("Failed to save goals. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Goals</CardTitle>
        <CardDescription>
          Select what matters most to you. This personalizes your workspace
          suggestions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GOALS.map((goal) => {
            const Icon = ICON_MAP[goal.icon] ?? BarChart3;
            const isSelected = selected.has(goal.categoryName);
            return (
              <button
                key={goal.categoryName}
                type="button"
                onClick={() => toggle(goal.categoryName)}
                className={`rounded-xl border p-4 space-y-2 text-left transition-colors ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : "bg-card hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`rounded-lg p-2 ${
                      isSelected ? "bg-primary/15" : "bg-primary/10"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">{goal.label}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {goal.description}
                </p>
              </button>
            );
          })}
        </div>

        {hasChanges && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Goals"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
