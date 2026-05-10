import React from 'react';

type SkeletonVariant = 'card-grid' | 'detail' | 'playthrough' | 'story';

interface LoadingSkeletonProps {
  variant: SkeletonVariant;
  count?: number;
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse bg-ink-700/50 rounded-lg ${className}`} />;
}

export function LoadingSkeleton({ variant, count = 6 }: LoadingSkeletonProps) {
  switch (variant) {
    case 'card-grid':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-ink-800 border border-ink-700 rounded-2xl overflow-hidden">
              <SkeletonBlock className="h-32 w-full rounded-none" />
              <div className="p-6 space-y-3">
                <SkeletonBlock className="h-6 w-3/4" />
                <SkeletonBlock className="h-4 w-1/3" />
                <SkeletonBlock className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      );

    case 'detail':
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-ink-800 border border-ink-700 rounded-2xl overflow-hidden">
              <SkeletonBlock className="h-48 sm:h-64 w-full rounded-none" />
              <div className="p-6 sm:p-8 space-y-4">
                <SkeletonBlock className="h-8 w-1/2" />
                <SkeletonBlock className="h-5 w-24" />
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-5/6" />
              </div>
            </div>
            <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6 sm:p-8 space-y-4">
              <SkeletonBlock className="h-6 w-1/4" />
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-20 w-full" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6 space-y-3">
              <SkeletonBlock className="h-5 w-1/2" />
              <SkeletonBlock className="h-12 w-full" />
              <SkeletonBlock className="h-12 w-full" />
            </div>
            <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6 space-y-3">
              <SkeletonBlock className="h-5 w-1/2" />
              <SkeletonBlock className="h-12 w-full" />
            </div>
          </div>
        </div>
      );

    case 'playthrough':
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-3">
              <SkeletonBlock className="h-6 w-1/3" />
              <SkeletonBlock className="h-40 w-full" />
            </div>
            <div className="space-y-3">
              <SkeletonBlock className="h-6 w-1/3" />
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-20 w-full" />
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <SkeletonBlock className="h-6 w-1/4" />
              <SkeletonBlock className="h-32 w-full" />
              <SkeletonBlock className="h-32 w-full" />
            </div>
            <div className="space-y-3">
              <SkeletonBlock className="h-6 w-1/4" />
              <SkeletonBlock className="h-24 w-full" />
            </div>
          </div>
        </div>
      );

    case 'story':
      return (
        <div className="max-w-3xl mx-auto space-y-6 py-12">
          <SkeletonBlock className="h-8 w-1/3" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-5/6" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-4/6" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-3/4" />
          <div className="flex gap-3 mt-8">
            <SkeletonBlock className="h-12 w-40" />
            <SkeletonBlock className="h-12 w-40" />
            <SkeletonBlock className="h-12 w-40" />
          </div>
        </div>
      );
  }
}