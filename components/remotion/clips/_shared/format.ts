/** Format a number in compact form (1.2M, 4.5K, etc.) */
export function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(n) >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return n.toFixed(n % 1 === 0 ? 0 : 1);
}
