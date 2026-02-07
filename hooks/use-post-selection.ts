"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface Post {
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
  commentsSyncedAt: string | null;
  syncedCommentCount: number;
  engagementRate: number;
}

export type SortBy =
  | "plays"
  | "likes"
  | "comments"
  | "shares"
  | "saves"
  | "postedAt"
  | "engagementRate";

export type SortDir = "asc" | "desc";

interface UsePostSelectionOptions {
  accountId: number;
  enabled?: boolean;
}

interface UsePostSelectionReturn {
  posts: Post[];
  total: number;
  pageCount: number;
  isLoading: boolean;
  pageIndex: number;
  pageSize: number;
  search: string;
  sortBy: SortBy;
  sortDir: SortDir;
  setPageIndex: (index: number) => void;
  setPageSize: (size: number) => void;
  setSearch: (search: string) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortDir: (sortDir: SortDir) => void;
}

export function usePostSelection({
  accountId,
  enabled = true,
}: UsePostSelectionOptions): UsePostSelectionReturn {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearchRaw] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("comments");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPageIndex(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const setSearch = useCallback((value: string) => {
    setSearchRaw(value);
  }, []);

  // Fetch posts when params change
  useEffect(() => {
    if (!enabled) return;

    // Cancel in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    async function fetchPosts() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          accountId: accountId.toString(),
          allPosts: "true",
          limit: pageSize.toString(),
          offset: (pageIndex * pageSize).toString(),
          sortBy,
          sortDir,
        });

        if (debouncedSearch) {
          params.set("search", debouncedSearch);
        }

        const response = await fetch(
          `/api/dashboard/recent-posts?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) throw new Error("Failed to fetch posts");

        const data = await response.json();
        setPosts(data.posts ?? []);
        setTotal(data.total ?? 0);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Failed to fetch posts:", error);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchPosts();

    return () => {
      controller.abort();
    };
  }, [accountId, enabled, pageIndex, pageSize, debouncedSearch, sortBy, sortDir]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return {
    posts,
    total,
    pageCount,
    isLoading,
    pageIndex,
    pageSize,
    search,
    sortBy,
    sortDir,
    setPageIndex,
    setPageSize,
    setSearch,
    setSortBy,
    setSortDir,
  };
}
