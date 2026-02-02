"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import type { FeatureKey, SubscriptionTier } from "@/lib/services/feature-service";

interface FeatureContextValue {
  tier: SubscriptionTier;
  features: Record<FeatureKey, boolean>;
  hasAccess: (featureKey: FeatureKey) => boolean;
}

const FeatureContext = createContext<FeatureContextValue | null>(null);

interface FeatureProviderProps {
  children: ReactNode;
  tier: SubscriptionTier;
  features: Record<FeatureKey, boolean>;
}

/**
 * FeatureProvider - Client component that provides feature access throughout the app
 * Receives tier and features from server components
 */
export function FeatureProvider({
  children,
  tier,
  features,
}: FeatureProviderProps) {
  const value = useMemo<FeatureContextValue>(
    () => ({
      tier,
      features,
      hasAccess: (featureKey: FeatureKey) => features[featureKey] ?? false,
    }),
    [tier, features]
  );

  return (
    <FeatureContext.Provider value={value}>{children}</FeatureContext.Provider>
  );
}

/**
 * useFeatures - Hook to access feature flags and tier information
 * @returns { tier, features, hasAccess }
 */
export function useFeatures(): FeatureContextValue {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error("useFeatures must be used within a FeatureProvider");
  }
  return context;
}

/**
 * useFeaturesOptional - Optional hook that returns null if not within provider.
 * Useful for components that may or may not have feature gating.
 * @returns { tier, features, hasAccess } | null
 */
export function useFeaturesOptional(): FeatureContextValue | null {
  return useContext(FeatureContext);
}
