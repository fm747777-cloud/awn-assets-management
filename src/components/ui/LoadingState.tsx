import React from 'react';

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 6 }: TableSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading workspace data"
      className="w-full divide-y divide-awn-border animate-pulse"
    >
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="px-4 py-3.5 grid gap-4 items-center"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, colIdx) => (
            <div
              key={colIdx}
              className={`h-4 rounded bg-awn-surface-alt ${
                colIdx === 0 ? 'w-24' : colIdx === 1 ? 'w-4/5' : 'w-2/3'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export interface MetricStripSkeletonProps {
  count?: number;
}

export function MetricStripSkeleton({ count = 4 }: MetricStripSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading summary metrics"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-pulse"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-awn-surface border border-awn-border rounded-lg p-4 space-y-2.5"
        >
          <div className="h-3 w-28 bg-awn-surface-alt rounded" />
          <div className="h-6 w-20 bg-awn-surface-alt rounded" />
          <div className="h-3 w-36 bg-awn-surface-alt rounded" />
        </div>
      ))}
    </div>
  );
}
