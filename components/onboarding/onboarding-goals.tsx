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
import { GOALS } from "@/lib/prompt-catalog";

const ICON_MAP: Record<string, LucideIcon> = {
  "bar-chart-3": BarChart3,
  lightbulb: Lightbulb,
  users: Users,
  "trending-up": TrendingUp,
  handshake: Handshake,
  "share-2": Share2,
};

interface OnboardingGoalsProps {
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function OnboardingGoals({
  onContinue,
  onBack,
  onSkip,
}: OnboardingGoalsProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
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

  const handleContinue = async () => {
    if (selected.size > 0) {
      setSaving(true);
      try {
        await fetch("/api/user/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goals: Array.from(selected) }),
        });
      } catch {
        // Non-blocking — goals are a preference, not critical
      } finally {
        setSaving(false);
      }
    }
    onContinue();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
      <div className="max-w-2xl mx-auto w-full text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            What are your goals?
          </h1>
          <p className="text-muted-foreground text-lg">
            Select what matters most to you. We&apos;ll personalize your
            experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
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
                      isSelected
                        ? "bg-primary/15"
                        : "bg-primary/10"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <h3 className="font-semibold">{goal.label}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {goal.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="space-y-3 pt-2">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={saving}
            className="w-full sm:w-auto px-8"
          >
            Continue
          </Button>
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
