'use client';

import { Loader2, AlertTriangle, X } from 'lucide-react';
import { useSyncOptional } from '@/contexts/sync-context';
import { useDismissedErrors } from '@/hooks/use-dismissed-errors';
import type { SyncJob } from '@/hooks/use-accounts';

function getJobDescription(job: SyncJob): string {
  if (job.type === 'posts' || job.type === 'full') {
    const count = job.postsCount;
    if (count) return `Importing posts... (${count} so far)`;
    return 'Importing posts...';
  }
  if (job.type === 'comments') {
    const count = job.commentsCount;
    const estimated = job.commentsEstimated;
    if (count && estimated) return `Syncing comments... (${count} of ~${estimated})`;
    if (count) return `Syncing comments... (${count} so far)`;
    return 'Syncing comments...';
  }
  return 'Syncing...';
}

export function WorkspaceSyncBanner() {
  const syncContext = useSyncOptional();
  const [dismissedErrors, dismissError] = useDismissedErrors();

  if (!syncContext) return null;

  const { accounts, syncData, isSyncing } = syncContext;

  // Collect active jobs per account
  const activeEntries: Array<{ username: string; jobs: SyncJob[] }> = [];
  for (const account of accounts) {
    const jobs = syncData[account.id]?.activeJobs ?? [];
    if (jobs.length > 0) {
      activeEntries.push({ username: account.username, jobs });
    }
  }

  // Collect failed jobs per account (only show if no successful sync completed after)
  const failedEntries: Array<{ username: string; job: SyncJob }> = [];
  for (const account of accounts) {
    const data = syncData[account.id];
    if (!data) continue;
    const lastCompletedAt = data.stats?.lastCompletedJobAt;
    const failedJob = (data.recentJobs ?? []).find(
      (j) =>
        j.status === 'failed' &&
        !dismissedErrors.has(j.id) &&
        (!lastCompletedAt ||
          new Date(j.completedAt ?? j.createdAt) > new Date(lastCompletedAt))
    );
    if (failedJob) {
      failedEntries.push({ username: account.username, job: failedJob });
    }
  }

  if (!isSyncing && activeEntries.length === 0 && failedEntries.length === 0) return null;

  return (
    <>
      {/* Active sync banner */}
      {activeEntries.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 mb-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
            <Loader2 className="size-4 animate-spin shrink-0" />
            Import in progress
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Your data is being imported. You can start chatting once it&apos;s ready.
          </p>
          <div className="space-y-1">
            {activeEntries.map(({ username, jobs }) =>
              jobs.map((job) => (
                <div key={job.id} className="flex items-center gap-2 text-xs text-primary/80">
                  <span className="text-muted-foreground">@{username}</span>
                  <span>&mdash;</span>
                  <span>{getJobDescription(job)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Failed sync banner */}
      {failedEntries.map(({ username, job }) => (
        <div
          key={job.id}
          className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 mb-4"
        >
          <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">
              Import failed for @{username}
            </p>
            <p className="text-xs text-destructive/80 mt-0.5 truncate">
              {job.error || 'An unknown error occurred during sync'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dismissError(job.id)}
            className="shrink-0 rounded-md p-1 text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Dismiss error"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </>
  );
}
