import { Badge } from "@/components/ui/badge";
import { Palette } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Themes & Customization — Astriq",
  description:
    "17 color palettes with light and dark mode support to make Astriq your own.",
};

export default function ThemesPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <Badge variant="secondary">
          <Palette className="size-3" />
          Themes
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          Themes & Customization
        </h1>
        <p className="text-lg text-muted-foreground">
          Make Astriq your own with extensive theming options. Choose from 17
          color palettes and switch between light and dark modes.
        </p>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-lg font-medium">17 Color Palettes</h2>
          <p className="text-sm text-muted-foreground">
            Select from a curated collection of 17 themed color palettes that
            transform the entire interface. From vibrant and bold to minimal and
            muted, there is a palette for every taste. Your chosen palette
            applies across the dashboard, canvas, and all pages.
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Light & Dark Mode</h2>
          <p className="text-sm text-muted-foreground">
            Toggle between light and dark modes to suit your preference or
            environment. Each color palette is carefully designed to look great
            in both modes. Your theme preference is saved and applied
            automatically on return.
          </p>
        </div>
      </div>
    </div>
  );
}
