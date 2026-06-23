import React from "react";
import { Skeleton, StatCardSkeleton, ChartSkeleton } from "./ui/Skeleton";

/**
 * Full-page skeleton shown while company intelligence loads. Mirrors the
 * Executive Overview layout (hero → KPI grid → charts) so the transition to
 * real content has no layout shift.
 */
export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      {/* Sidebar rail placeholder */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col bg-white border-r border-[#E2E8F0] p-4 gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-2 mt-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-xl" />
          ))}
        </div>
        <div className="mt-auto space-y-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </aside>

      <div className="flex flex-col min-h-screen lg:pl-64">
        {/* Header placeholder */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-[#E2E8F0] bg-white/80">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-9 w-40 rounded-xl" />
        </header>

        <main className="flex-grow p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Hero placeholder */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 p-6 sm:p-8 space-y-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-2/3 max-w-md" />
            <Skeleton className="h-4 w-1/2 max-w-sm" />
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-premium p-5 space-y-4">
              <Skeleton className="h-4 w-40" />
              <ChartSkeleton height={300} />
            </div>
            <div className="card-premium p-5 space-y-4">
              <Skeleton className="h-4 w-32" />
              <div className="space-y-3 pt-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
