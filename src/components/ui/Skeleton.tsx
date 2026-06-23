import React from "react";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/** Single shimmer block. Compose to build any loading placeholder. */
export function Skeleton({ className = "", style }: SkeletonProps) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

/** Ready-made KPI card skeleton matching StatCard dimensions. */
export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-2 w-full">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-20" />
        </div>
        <Skeleton className="h-11 w-11 rounded-xl" />
      </div>
      <Skeleton className="h-9 w-full mt-4 rounded-lg" />
    </div>
  );
}

/** Generic chart skeleton block. */
export function ChartSkeleton({ height = 320 }: { height?: number }) {
  return (
    <div className="w-full flex items-end gap-3 px-2" style={{ height }}>
      {[60, 80, 45, 92, 70, 55].map((h, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t-lg"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export default Skeleton;
