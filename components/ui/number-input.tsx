"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function NumberInput({
  value,
  onChange,
  min = 1,
  max = Infinity,
  step = 1,
  placeholder,
  className,
}: NumberInputProps) {
  const [rawText, setRawText] = useState<string | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setRawText(text);

      const parsed = parseInt(text, 10);
      if (!isNaN(parsed)) {
        onChange(clamp(parsed, min, max));
      }
    },
    [onChange, min, max]
  );

  const handleBlur = useCallback(() => {
    setRawText(null);
    // Re-emit clamped value to ensure parent state is correct
    onChange(clamp(value, min, max));
  }, [value, onChange, min, max]);

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setRawText(value.toString());
      e.target.select();
    },
    [value]
  );

  return (
    <Input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      value={rawText !== null ? rawText : value}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className={cn("h-8 text-sm", className)}
    />
  );
}
