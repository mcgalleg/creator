'use client';

import { ReactNode } from 'react';
import { useFeatures } from '@/contexts/feature-context';
import type { FeatureKey } from '@/lib/services/feature-service';

interface FeatureGateProps {
  /** The feature key to check access for */
  feature: FeatureKey;
  /** Content to render when the user has access to the feature */
  children: ReactNode;
  /** Optional fallback content to render when the user does not have access */
  fallback?: ReactNode;
}

/**
 * FeatureGate component that conditionally renders children based on feature access.
 *
 * @example
 * ```tsx
 * <FeatureGate feature="canvas" fallback={<UpgradeButton />}>
 *   <CanvasWorkspace />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const { hasAccess } = useFeatures();

  if (hasAccess(feature)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
