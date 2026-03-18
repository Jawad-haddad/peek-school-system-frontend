/**
 * Skeleton loading components for Golden Path pages.
 * Uses CSS animate-pulse shimmer — no external dependencies.
 */

// ── Shared primitives ─────────────────────────────────────────────────────────

const Shimmer = ({ className = '' }: { className?: string }) => (
    <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`} />
);

// ── TableSkeleton ─────────────────────────────────────────────────────────────
// Use for: /classes/[classId] student list, /attendance

type TableSkeletonProps = { rows?: number; cols?: number };

export function TableSkeleton({ rows = 5, cols = 3 }: TableSkeletonProps) {
    return (
        <div className="w-full overflow-x-auto rounded-xl shadow-sm border border-gray-100 bg-white">
            {/* Fake thead */}
            <div className="flex gap-4 px-6 py-4 border-b border-gray-100 bg-gray-50">
                {Array.from({ length: cols }).map((_, i) => (
                    <Shimmer key={i} className={`h-3 rounded ${i === cols - 1 ? 'ml-auto w-16' : 'flex-1'}`} />
                ))}
            </div>
            {/* Fake rows */}
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex gap-4 items-center px-6 py-4 border-b border-gray-50 last:border-0">
                    {Array.from({ length: cols }).map((_, c) => (
                        <Shimmer
                            key={c}
                            className={`h-4 ${c === 0 ? 'w-32' : c === cols - 1 ? 'ml-auto w-20' : 'flex-1'}`}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

// ── CardsSkeleton ─────────────────────────────────────────────────────────────
// Use for: /classes grid, /pos product grid

type CardsSkeletonProps = { count?: number };

export function CardsSkeleton({ count = 6 }: CardsSkeletonProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 animate-pulse">
                    <div className="flex justify-between items-start">
                        <Shimmer className="h-12 w-12 rounded-2xl" />
                        <Shimmer className="h-5 w-20 rounded-full" />
                    </div>
                    <Shimmer className="h-6 w-3/4" />
                    <Shimmer className="h-4 w-1/2" />
                </div>
            ))}
        </div>
    );
}

// ── DashboardSkeleton ─────────────────────────────────────────────────────────
// Use for: /dashboard main loading, /reports

export function DashboardSkeleton() {
    return (
        <div className="p-8 space-y-8 animate-pulse">
            {/* Stat cards row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <div className="flex justify-between">
                            <Shimmer className="h-12 w-12 rounded-xl" />
                        </div>
                        <Shimmer className="h-3 w-24" />
                        <Shimmer className="h-8 w-16" />
                    </div>
                ))}
            </div>
            {/* Two wide panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {[0, 1].map((i) => (
                    <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                        <Shimmer className="h-5 w-40" />
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, j) => (
                                <Shimmer key={j} className={`h-10 w-full rounded-2xl`} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
