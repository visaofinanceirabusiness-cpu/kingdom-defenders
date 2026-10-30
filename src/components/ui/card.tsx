import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl border border-border bg-surface p-6 shadow-sm', className)}
      {...props}
    />
  );
}

export function CardHoverable({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <Card className={cn('aulaplay-card-hover cursor-pointer', className)} {...props} />;
}
