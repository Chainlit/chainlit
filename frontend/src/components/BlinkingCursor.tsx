import { cn } from '@/lib/utils';

export const CURSOR_PLACEHOLDER = '\u200B';

interface Props {
  whitespace?: boolean;
}

export default function BlinkingCursor({ whitespace }: Props) {
  return (
    <span className={cn('inline-block loading-cursor', whitespace && 'ml-2')} />
  );
}
