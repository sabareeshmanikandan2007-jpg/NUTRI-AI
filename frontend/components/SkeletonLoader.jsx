export default function SkeletonLoader({ className = '' }) {
  return (
    <div
      className={`shimmer rounded-xl bg-emerald-100/70 ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}
