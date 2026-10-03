import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level loading skeletons (used by loading.tsx files).
 * Each mirrors its page layout so navigation feels instant —
 * Next.js swaps these in the moment a <Link> is clicked.
 */

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6 animate-in fade-in duration-200">{children}</div>;
}

function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E6E3DB]">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-3 w-72" />
      </div>
      <Skeleton className="h-8 w-28" />
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="bg-white p-3 border border-[#E6E3DB] rounded-xs">
      <Skeleton className="h-8 w-full max-w-sm" />
    </div>
  );
}

export function TableListSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <PageShell>
      <PageHeaderSkeleton />
      <SearchSkeleton />
      <div className="hidden md:block bg-white border border-[#E6E3DB] rounded-xs overflow-hidden">
        <div className="bg-[#FAF9F6] border-b border-[#E6E3DB] px-6 py-3.5 flex gap-6">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
        <div className="divide-y divide-[#F0ECE1]">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="px-6 py-4 flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
        </div>
      </div>
      <div className="md:hidden space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 bg-white border border-[#E6E3DB] rounded-xs space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function CardsListSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <PageShell>
      <PageHeaderSkeleton />
      <SearchSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="p-5 bg-white border border-[#E6E3DB] rounded-xs space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-16 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function CustomerDetailSkeleton() {
  return (
    <PageShell>
      <Skeleton className="h-4 w-32" />
      {/* Header card */}
      <div className="bg-white border border-[#E6E3DB] rounded-xs p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="flex gap-6">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-14" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Measurements */}
        <div className="bg-white border border-[#E6E3DB] rounded-xs p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
        {/* Order history */}
        <div className="bg-white border border-[#E6E3DB] rounded-xs p-6 space-y-3">
          <Skeleton className="h-5 w-36" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 border border-[#E6E3DB] rounded-xs space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function OrderDetailSkeleton() {
  return (
    <PageShell>
      <Skeleton className="h-4 w-32" />
      {/* Header card */}
      <div className="bg-white border border-[#E6E3DB] rounded-xs p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <div className="bg-white border border-[#E6E3DB] rounded-xs p-6 space-y-4">
            <Skeleton className="h-5 w-36" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
          {/* Photos */}
          <div className="bg-white border border-[#E6E3DB] rounded-xs p-6 space-y-3">
            <Skeleton className="h-5 w-28" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {/* Details + documents */}
          <div className="bg-white border border-[#E6E3DB] rounded-xs p-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
          <div className="bg-white border border-[#E6E3DB] rounded-xs p-6 space-y-2">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
