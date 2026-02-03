/**
 * Persistent Async State Utilities
 *
 * Provides localStorage-based persistence for long-running async operations
 * so that state survives page refreshes. Used for:
 * - Account connection
 * - Account sync (posts)
 * - Comment sync
 * - Other long-running operations
 */

// Storage key prefixes
export const STORAGE_KEYS = {
  ACCOUNT_CONNECTION: "creator_pending_account_connection",
  ACCOUNT_SYNC: "creator_pending_account_sync",
  COMMENT_SYNC: "creator_pending_comment_sync",
} as const;

// Default expiration times (in milliseconds)
export const EXPIRATION_TIMES = {
  SHORT: 2 * 60 * 1000, // 2 minutes - for quick operations
  MEDIUM: 15 * 60 * 1000, // 15 minutes - for sync operations
  LONG: 60 * 60 * 1000, // 1 hour - for very long operations
} as const;

/**
 * Base interface for all pending operation states
 */
export interface BasePendingState {
  startedAt: number;
}

/**
 * Pending account connection state
 */
export interface PendingAccountConnection extends BasePendingState {
  username: string;
}

/**
 * Pending account sync state
 */
export interface PendingAccountSync extends BasePendingState {
  accountId: number;
  accountUsername: string;
  jobId: number;
  type: "posts" | "full";
}

/**
 * Pending comment sync state
 */
export interface PendingCommentSync extends BasePendingState {
  accountId: number;
  accountUsername: string;
  jobId: number;
  mode: "selection" | "top_performers" | "date_range" | "budget";
  postCount: number;
}

/**
 * Generic function to get pending state from localStorage
 */
export function getPendingState<T extends BasePendingState>(
  key: string,
  expirationMs: number = EXPIRATION_TIMES.MEDIUM
): T | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as T;

    // Check expiration
    if (Date.now() - parsed.startedAt > expirationMs) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed;
  } catch {
    // Clear corrupted data
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors when clearing
    }
    return null;
  }
}

/**
 * Generic function to set pending state in localStorage
 */
export function setPendingState<T extends BasePendingState>(
  key: string,
  state: Omit<T, "startedAt">
): void {
  if (typeof window === "undefined") return;

  try {
    const fullState = {
      ...state,
      startedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(fullState));
  } catch {
    // Ignore storage errors (e.g., quota exceeded)
    console.warn(`Failed to persist state for key: ${key}`);
  }
}

/**
 * Generic function to clear pending state from localStorage
 */
export function clearPendingState(key: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore errors when clearing
  }
}

/**
 * Get all pending syncs for a specific account
 */
export function getPendingAccountSync(
  accountId: number
): PendingAccountSync | null {
  const key = `${STORAGE_KEYS.ACCOUNT_SYNC}_${accountId}`;
  return getPendingState<PendingAccountSync>(key, EXPIRATION_TIMES.MEDIUM);
}

/**
 * Set pending account sync state
 */
export function setPendingAccountSync(
  accountId: number,
  state: Omit<PendingAccountSync, "startedAt">
): void {
  const key = `${STORAGE_KEYS.ACCOUNT_SYNC}_${accountId}`;
  setPendingState<PendingAccountSync>(key, state);
}

/**
 * Clear pending account sync state
 */
export function clearPendingAccountSync(accountId: number): void {
  const key = `${STORAGE_KEYS.ACCOUNT_SYNC}_${accountId}`;
  clearPendingState(key);
}

/**
 * Get pending comment sync for a specific account
 */
export function getPendingCommentSync(
  accountId: number
): PendingCommentSync | null {
  const key = `${STORAGE_KEYS.COMMENT_SYNC}_${accountId}`;
  return getPendingState<PendingCommentSync>(key, EXPIRATION_TIMES.MEDIUM);
}

/**
 * Set pending comment sync state
 */
export function setPendingCommentSync(
  accountId: number,
  state: Omit<PendingCommentSync, "startedAt">
): void {
  const key = `${STORAGE_KEYS.COMMENT_SYNC}_${accountId}`;
  setPendingState<PendingCommentSync>(key, state);
}

/**
 * Clear pending comment sync state
 */
export function clearPendingCommentSync(accountId: number): void {
  const key = `${STORAGE_KEYS.COMMENT_SYNC}_${accountId}`;
  clearPendingState(key);
}

/**
 * Clear pending account connection if it matches the given username
 */
export function clearPendingConnectionForUsername(username: string): void {
  const pending = getPendingState<PendingAccountConnection>(
    STORAGE_KEYS.ACCOUNT_CONNECTION,
    EXPIRATION_TIMES.SHORT
  );
  if (pending && pending.username.toLowerCase() === username.toLowerCase()) {
    clearPendingState(STORAGE_KEYS.ACCOUNT_CONNECTION);
  }
}

/**
 * Get all pending syncs across all accounts
 * Useful for showing a global "syncs in progress" indicator
 */
export function getAllPendingSyncs(): {
  accountSyncs: Array<PendingAccountSync & { accountId: number }>;
  commentSyncs: Array<PendingCommentSync & { accountId: number }>;
} {
  if (typeof window === "undefined") {
    return { accountSyncs: [], commentSyncs: [] };
  }

  const accountSyncs: Array<PendingAccountSync & { accountId: number }> = [];
  const commentSyncs: Array<PendingCommentSync & { accountId: number }> = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.startsWith(STORAGE_KEYS.ACCOUNT_SYNC + "_")) {
        const accountId = parseInt(key.split("_").pop() || "0", 10);
        const state = getPendingAccountSync(accountId);
        if (state) {
          accountSyncs.push({ ...state, accountId });
        }
      }

      if (key.startsWith(STORAGE_KEYS.COMMENT_SYNC + "_")) {
        const accountId = parseInt(key.split("_").pop() || "0", 10);
        const state = getPendingCommentSync(accountId);
        if (state) {
          commentSyncs.push({ ...state, accountId });
        }
      }
    }
  } catch {
    // Ignore errors when reading
  }

  return { accountSyncs, commentSyncs };
}
