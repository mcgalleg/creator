"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ============================================================================
// Types for API Response Data
// ============================================================================

export type Period = "7d" | "30d" | "90d";

// Overview metrics from /api/dashboard/overview
export interface OverviewMetrics {
  followers: number;
  followerChange: number;
  totalPlays: number;
  playsChange: number;
  engagementRate: number;
  engagementRateChange: number;
  contentVelocity: number;
}

export interface OverviewData {
  metrics: OverviewMetrics;
}

// Engagement time-series from /api/dashboard/engagement
export interface EngagementDataPoint {
  date: string;
  plays: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface EngagementData {
  data: EngagementDataPoint[];
}

// Top content from /api/dashboard/top-content
export interface TopContentVideo {
  id: number;
  tiktokId: string;
  description: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  likes: number;
  comments: number;
  shares: number;
  plays: number;
  saves: number;
  postedAt: string | null;
  engagementRate: number;
}

export interface TopContentData {
  videos: TopContentVideo[];
}

// Recent posts from /api/dashboard/recent-posts
export interface RecentPost {
  id: number;
  tiktokId: string;
  description: string | null;
  thumbnailUrl: string | null;
  likes: number;
  comments: number;
  shares: number;
  plays: number;
  saves: number;
  postedAt: string | null;
  engagementRate: number;
}

export interface RecentPostsData {
  posts: RecentPost[];
  total: number;
}

// Breakdown from /api/dashboard/breakdown
export type EngagementType = "likes" | "comments" | "shares" | "saves";

export interface BreakdownItem {
  type: EngagementType;
  value: number;
  percentage: number;
}

export interface BreakdownData {
  breakdown: BreakdownItem[];
}

// ============================================================================
// Hook Interface
// ============================================================================

export interface UseDashboardDataOptions {
  accountId: number | null;
  period: Period;
  topContentLimit?: number;
  recentPostsLimit?: number;
}

export interface DashboardData {
  overview: OverviewData | null;
  engagement: EngagementData | null;
  topContent: TopContentData | null;
  recentPosts: RecentPostsData | null;
  breakdown: BreakdownData | null;
}

export interface UseDashboardDataReturn {
  data: DashboardData;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Failed to fetch ${url}`);
  }

  return data as T;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useDashboardData(
  options: UseDashboardDataOptions
): UseDashboardDataReturn {
  const { accountId, period, topContentLimit = 6, recentPostsLimit = 10 } = options;

  const [data, setData] = useState<DashboardData>({
    overview: null,
    engagement: null,
    topContent: null,
    recentPosts: null,
    breakdown: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track the current fetch to avoid race conditions
  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    // Don't fetch if accountId is null
    if (accountId === null) {
      setData({
        overview: null,
        engagement: null,
        topContent: null,
        recentPosts: null,
        breakdown: null,
      });
      setIsLoading(false);
      setError(null);
      return;
    }

    // Increment fetch ID to track this fetch
    const currentFetchId = ++fetchIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      // Build URLs for all endpoints
      const baseParams = `accountId=${accountId}&period=${period}`;

      const urls = {
        overview: `/api/dashboard/overview?${baseParams}`,
        engagement: `/api/dashboard/engagement?${baseParams}`,
        topContent: `/api/dashboard/top-content?${baseParams}&limit=${topContentLimit}`,
        recentPosts: `/api/dashboard/recent-posts?${baseParams}&limit=${recentPostsLimit}`,
        breakdown: `/api/dashboard/breakdown?${baseParams}`,
      };

      // Fetch all endpoints in parallel
      const [overview, engagement, topContent, recentPosts, breakdown] =
        await Promise.all([
          fetchJson<OverviewData>(urls.overview),
          fetchJson<EngagementData>(urls.engagement),
          fetchJson<TopContentData>(urls.topContent),
          fetchJson<RecentPostsData>(urls.recentPosts),
          fetchJson<BreakdownData>(urls.breakdown),
        ]);

      // Only update state if this is still the latest fetch
      if (currentFetchId === fetchIdRef.current) {
        setData({
          overview,
          engagement,
          topContent,
          recentPosts,
          breakdown,
        });
        setError(null);
      }
    } catch (err) {
      // Only update state if this is still the latest fetch
      if (currentFetchId === fetchIdRef.current) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch dashboard data";
        setError(new Error(errorMessage));
        // Keep previous data on error (partial failure handling could be added)
      }
    } finally {
      // Only update loading state if this is still the latest fetch
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [accountId, period, topContentLimit, recentPostsLimit]);

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
