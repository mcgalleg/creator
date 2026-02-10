"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CreditsContext, useCreditsInternal, CREDITS_KEY } from "@/hooks/use-credits";
import { mutate } from "swr";

function CreditsProviderInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isCheckoutSuccess = searchParams.get("checkout") === "success";
  const aggressiveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Aggressive polling after checkout success: 3s for 30s
  useEffect(() => {
    if (!isCheckoutSuccess) return;

    // Start aggressive polling
    aggressiveIntervalRef.current = setInterval(() => {
      mutate(CREDITS_KEY);
    }, 3_000);

    // Stop after 30s
    const timeout = setTimeout(() => {
      if (aggressiveIntervalRef.current) {
        clearInterval(aggressiveIntervalRef.current);
        aggressiveIntervalRef.current = null;
      }
    }, 30_000);

    // Clean up URL param
    const url = new URL(window.location.href);
    url.searchParams.delete("checkout");
    router.replace(url.pathname + url.search, { scroll: false });

    return () => {
      if (aggressiveIntervalRef.current) {
        clearInterval(aggressiveIntervalRef.current);
      }
      clearTimeout(timeout);
    };
  }, [isCheckoutSuccess, router]);

  const credits = useCreditsInternal();

  return (
    <CreditsContext value={credits}>
      {children}
    </CreditsContext>
  );
}

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <CreditsProviderInner>{children}</CreditsProviderInner>
    </Suspense>
  );
}
