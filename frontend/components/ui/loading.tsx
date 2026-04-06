import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-slate-700/50', className)} />
  );
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center space-x-3 py-8">
      <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
      <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse delay-100"></div>
      <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse delay-200"></div>
      <span className="ml-2 text-sm text-slate-400">{message}</span>
    </div>
  );
}

export function ErrorState({ message = 'Error loading data' }: { message?: string }) {
  return (
    <div className="rounded-lg border border-red-800/30 bg-red-900/10 p-4">
      <p className="text-sm text-red-300">{message}</p>
    </div>
  );
}

export function EmptyState({ message = 'No data available' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}
