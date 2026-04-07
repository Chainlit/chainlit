import { cn } from '@/lib/utils';

export const Stop = ({ className }: { className?: string }) => {
  return (
    <span
      className={cn('inline-block stop-icon', className)}
      role="img"
      aria-hidden="true"
    />
  );
};
