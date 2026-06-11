import { cn } from '@/lib/utils';

export const CURSOR_PLACEHOLDER = '\u200B';

interface Props {
  whitespace?: boolean;
}

export default function BlinkingCursor({ whitespace }: { whitespace?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 py-2 ${whitespace ? 'ml-2' : ''}`}>
      <span className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
      <span className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
      <span className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
    </span>
  );
}
