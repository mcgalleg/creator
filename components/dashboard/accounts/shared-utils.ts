export function formatNumber(num: number | null): string {
  if (num === null) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never synced";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function getActiveJobDescription(job: { type: string; postsCount?: number | null; commentsCount?: number | null; commentsEstimated?: number | null }): string {
  if (job.type === "posts" || job.type === "full") {
    const count = job.postsCount;
    if (count) return `Importing posts... (${count} so far)`;
    return "Importing posts...";
  }
  if (job.type === "comments") {
    const count = job.commentsCount;
    const estimated = job.commentsEstimated;
    if (count && estimated) return `Syncing comments... (${count} of ~${estimated})`;
    return "Syncing comments...";
  }
  return "Syncing...";
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}
