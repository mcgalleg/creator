"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import type { FeatureKey } from "@/lib/auth";

interface FeatureAccessContextValue {
  features: Record<string, boolean>;
  hasFeature: (featureKey: FeatureKey) => boolean;
}

const FeatureAccessContext = createContext<FeatureAccessContextValue | null>(null);

interface FeatureAccessProviderProps {
  children: ReactNode;
  features: Record<string, boolean>;
}

/**
 * FeatureAccessProvider - Passes server-resolved feature access to client components.
 *
 * Features are resolved server-side via Clerk has() (or DB fallback in BYPASS_AUTH mode)
 * and passed down through this context. This replaces the old FeatureProvider.
 */
export function FeatureAccessProvider({
  children,
  features,
}: FeatureAccessProviderProps) {
  const value = useMemo<FeatureAccessContextValue>(
    () => ({
      features,
      hasFeature: (featureKey: FeatureKey) => features[featureKey] ?? false,
    }),
    [features]
  );

  return (
    <FeatureAccessContext.Provider value={value}>
      {children}
    </FeatureAccessContext.Provider>
  );
}

/**
 * useHasFeature - Check if the current user has access to a feature.
 *
 * In production, this reads features resolved via Clerk has() on the server.
 * In BYPASS_AUTH mode, features are resolved from the DB tier.
 */
export function useHasFeature(featureKey: FeatureKey): boolean {
  const context = useContext(FeatureAccessContext);
  if (!context) {
    throw new Error("useHasFeature must be used within a FeatureAccessProvider");
  }
  return context.hasFeature(featureKey);
}

/**
 * useHasFeatureOptional - Like useHasFeature but returns false if outside provider.
 * Useful for components that may or may not be within the feature access context.
 */
export function useHasFeatureOptional(featureKey: FeatureKey): boolean {
  const context = useContext(FeatureAccessContext);
  return context?.hasFeature(featureKey) ?? false;
}
