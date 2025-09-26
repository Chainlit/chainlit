import { cn } from '@/lib/utils';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';

import { Textarea } from '@/components/ui/textarea';

interface Props extends Omit<React.ComponentProps<'textarea'>, 'onPaste'> {
  maxHeight?: number;
  placeholder?: string;
  onPaste?: (event: ClipboardEvent) => void;
  onEnter?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, Props>(
  (
    {
      maxHeight,
      onPaste,
      onEnter,
      placeholder,
      className,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isComposing, setIsComposing] = useState(false);

    useImperativeHandle(ref, () => textareaRef.current!, []);

    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea || !onPaste) return;

      textarea.addEventListener('paste', onPaste);

      return () => {
        textarea.removeEventListener('paste', onPaste);
      };
    }, [onPaste]);

    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea || !maxHeight) return;
      textarea.style.height = '40px';
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    }, [props.value, maxHeight]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Call the parent's onKeyDown first (this is Input's handler)
      if (onKeyDown) {
        onKeyDown(event);
      }

      // Only handle our Enter logic if the event wasn't already handled
      if (
        !event.defaultPrevented &&
        event.key === 'Enter' &&
        !event.shiftKey &&
        onEnter &&
        !isComposing
      ) {
        event.preventDefault();
        onEnter(event);
      }
    };

    return (
      <Textarea
        // Мы по-прежнему используем наш внутренний ref
        ref={textareaRef}
        {...props}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        className={cn(
          'p-0 min-h-[40px] h-[40px] rounded-none resize-none border-none overflow-y-auto shadow-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0',
          className
        )}
        placeholder={placeholder}
        style={{ maxHeight }}
      />
    );
  }
);

export default AutoResizeTextarea;
