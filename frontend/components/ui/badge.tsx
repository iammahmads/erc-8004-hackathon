import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'destructive' | 'warning' | 'secondary';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-slate-700 text-slate-100',
    success: 'bg-green-900/30 text-green-300 border border-green-800',
    destructive: 'bg-red-900/30 text-red-300 border border-red-800',
    warning: 'bg-yellow-900/30 text-yellow-300 border border-yellow-800',
    secondary: 'bg-blue-900/30 text-blue-300 border border-blue-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
