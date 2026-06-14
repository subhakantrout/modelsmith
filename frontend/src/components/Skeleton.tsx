interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse-slow rounded-md bg-gray-700/50 ${className}`}
    />
  );
}
