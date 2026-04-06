import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border border-slate-700 bg-slate-800/50 p-6 shadow-sm hover:bg-slate-800/70 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardProps) {
  return <h2 className={cn('text-lg font-semibold text-slate-100', className)}>{children}</h2>;
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn('text-sm text-slate-300', className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardProps) {
  return <div className={cn('mt-4 pt-4 border-t border-slate-700', className)}>{children}</div>;
}
