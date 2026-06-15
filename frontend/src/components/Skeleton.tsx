interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className = "", count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-800/60 rounded ${className}`}
        />
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 items-center">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-12 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function NodeSkeleton() {
  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-3 space-y-2 w-48">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-6 w-full rounded" />
      <Skeleton className="h-6 w-full rounded" />
      <Skeleton className="h-5 w-16 rounded" />
    </div>
  );
}

export function ViewSkeleton() {
  return (
    <div className="flex h-full gap-4 p-4">
      <div className="w-48 space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-full rounded-lg" />
        <Skeleton className="h-8 w-full rounded-lg" />
        <Skeleton className="h-8 w-full rounded-lg" />
        <Skeleton className="h-8 w-3/4 rounded-lg" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="flex gap-3">
          <Skeleton className="h-24 flex-1 rounded-xl" />
          <Skeleton className="h-24 flex-1 rounded-xl" />
          <Skeleton className="h-24 flex-1 rounded-xl" />
        </div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-900/40 border border-gray-800/50">
          <Skeleton className="h-4 w-4 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-2 w-2/5" />
          </div>
          <Skeleton className="h-4 w-12 rounded" />
        </div>
      ))}
    </div>
  );
}