"use client";

import { CreditsContext, useCreditsInternal } from "@/hooks/use-credits";

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const credits = useCreditsInternal();

  return (
    <CreditsContext value={credits}>
      {children}
    </CreditsContext>
  );
}
