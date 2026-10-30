import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'accent' | 'success' | 'neutral' | 'warning';

const TONE_CLASSES: Record<Tone, string> = {
  brand: 'bg-brand-100 text-brand-700',
  accent: 'bg-accent-400/15 text-accent-600',
  success: 'bg-success-500/15 text-success-600',
  neutral: 'bg-surface-muted text-foreground/70',
  warning: 'bg-amber-100 text-amber-700',
};

export function Badge({ tone = 'neutral', className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold', TONE_CLASSES[tone], className)}
      {...props}
    />
  );
}
