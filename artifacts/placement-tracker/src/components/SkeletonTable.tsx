import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export function SkeletonTable({ rows = 8, cols = 6 }: SkeletonTableProps) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-4 px-4 py-2.5 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 rounded" style={{ width: `${60 + (i % 3) * 20}px` }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 px-4 py-3 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-3.5 rounded" style={{ width: `${50 + ((rowIdx + colIdx) % 4) * 25}px` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))' }}>
          <Skeleton className="h-3 w-24 mb-3 rounded" />
          <Skeleton className="h-7 w-20 mb-1 rounded" />
          <Skeleton className="h-2.5 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}
