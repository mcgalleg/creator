"use client";

import { Palette, Check, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useAccentColor, ACCENT_COLORS, type AccentColor } from "@/contexts/accent-color-context";

const COLOR_SWATCHES: Record<AccentColor, string> = {
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  cyan: "bg-cyan-500",
  emerald: "bg-emerald-500",
  fuchsia: "bg-fuchsia-500",
  green: "bg-green-500",
  indigo: "bg-indigo-500",
  lime: "bg-lime-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  purple: "bg-purple-500",
  red: "bg-red-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
  teal: "bg-teal-500",
  violet: "bg-violet-500",
  yellow: "bg-yellow-500",
};

export function AccentColorPicker() {
  const { accentColor, setAccentColor } = useAccentColor();
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Theme settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[216px] p-3">
        {/* Dark / Light toggle */}
        <DropdownMenuLabel className="px-0 pb-2 text-xs font-medium text-muted-foreground">
          Mode
        </DropdownMenuLabel>
        <div className="flex gap-1 mb-1">
          <button
            onClick={() => setTheme("light")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
              theme === "light"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            Light
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
              theme === "dark"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            Dark
          </button>
        </div>

        <DropdownMenuSeparator />

        {/* Accent color grid */}
        <DropdownMenuLabel className="px-0 pb-2 pt-1 text-xs font-medium text-muted-foreground">
          Accent Color
        </DropdownMenuLabel>
        <div className="grid grid-cols-6 gap-2">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setAccentColor(color)}
              className={`relative h-6 w-6 rounded-full ${COLOR_SWATCHES[color]} transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                accentColor === color ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
              }`}
              title={color.charAt(0).toUpperCase() + color.slice(1)}
            >
              {accentColor === color && (
                <Check className="absolute inset-0 m-auto h-3 w-3 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
              )}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
