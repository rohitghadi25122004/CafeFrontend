import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
    return (
        <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`}></div>
    );
};

export const MenuCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
            <Skeleton className="w-full aspect-square rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
        </div>
    );
};

export const OrderItemSkeleton: React.FC = () => {
    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
        </div>
    );
};
