import { AppLayout } from "@/components/layout/AppLayout";

export const ProfileSkeleton = () => {
    return (
        <div className="container mx-auto px-4 py-8 mb-60 max-w-4xl">
            {/* Profile Header Skeleton */}
            <div className="bg-card rounded-2xl border border-border shadow-sm mb-6 p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 md:items-start">
                    {/* Avatar Skeleton */}
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-muted animate-pulse" />

                    {/* Info Skeleton */}
                    <div className="flex-1 min-w-0 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="space-y-2">
                                <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-9 w-28 bg-muted rounded animate-pulse" />
                                <div className="h-9 w-28 bg-muted rounded animate-pulse" />
                            </div>
                        </div>

                        <div className="space-y-2 max-w-2xl">
                            <div className="h-4 w-full bg-muted rounded animate-pulse" />
                            <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                            <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Tags Section Skeleton */}
                <div className="mt-8 pt-6 border-t border-border space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                        <div className="flex gap-2">
                            <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                            <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                            <div className="h-6 w-14 bg-muted rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                        <div className="flex gap-2">
                            <div className="h-6 w-24 bg-muted rounded animate-pulse" />
                            <div className="h-6 w-18 bg-muted rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
