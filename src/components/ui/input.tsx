import { type InputHTMLAttributes, type LabelHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-sm font-semibold text-foreground', className)} {...props} />;
}

const fieldClasses =
  'w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-base text-foreground placeholder:text-foreground/40 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={cn(fieldClasses, className)} {...props} />;
  }
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return <textarea ref={ref} className={cn(fieldClasses, 'min-h-28 resize-y', className)} {...props} />;
  }
);
Textarea.displayName = 'Textarea';

export function FieldError({ children }: { children?: string | null }) {
  if (!children) return null;
  return <p className="mt-1 text-sm text-red-600">{children}</p>;
}
