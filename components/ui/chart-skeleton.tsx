import { Skeleton } from '@/components/ui/skeleton';

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="w-full" style={{ height }} />
    </div>
  );
}
