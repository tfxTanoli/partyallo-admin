import { Skeleton } from '@/components/ui/skeleton';

/** Bar-shaped placeholder that mirrors the real chart's footprint. */
export function ChartSkeleton() {
  const heights = [45, 68, 52, 78, 62, 88, 55, 72, 60, 82, 48, 70];

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-3 w-20" />
        ))}
      </div>
      <div className="flex h-[17.5rem] items-end gap-2 sm:gap-3">
        {heights.map((height, index) => (
          <Skeleton key={index} className="flex-1 rounded-t-md" style={{ height: `${height}%` }} />
        ))}
      </div>
    </div>
  );
}
