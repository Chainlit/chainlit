import { cn } from '@/lib/utils';

export const CURSOR_PLACEHOLDER = '\u200B';

interface Props {
  whitespace?: boolean;
}

export default function BlinkingCursor({ whitespace }: Props) {
  return (
    <span
      className={cn(
        'inline-block h-3.5 w-3.5 bg-foreground rounded-full animate-pulse',
        whitespace && 'ml-2'
      )}
    />
  );
}
