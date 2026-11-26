import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        success: 'border-transparent bg-[var(--status-success)]/15 text-[var(--status-success)]',
        warning: 'border-transparent bg-[var(--status-warning)]/15 text-[var(--status-warning)]',
        destructive: 'border-transparent bg-[var(--status-danger)]/15 text-[var(--status-danger)]',
        info: 'border-transparent bg-[var(--status-info)]/15 text-[var(--status-info)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
