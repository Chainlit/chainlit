import { cn, hasMessage } from '@/lib/utils';

import { FileSpec, useChatMessages } from '@chainlit/react-client';

import WaterMark from '@/components/WaterMark';

import MessageComposer from './MessageComposer';
import ScrollDownButton from './ScrollDownButton';

interface Props {
  fileSpec: FileSpec;
  onFileUpload: (payload: File[]) => void;
  onFileUploadError: (error: string) => void;
  setAutoScroll: (autoScroll: boolean) => void;
  autoScroll: boolean;
  showIfEmptyThread?: boolean;
}

export default function ChatFooter({
  autoScroll,
  showIfEmptyThread,
  ...props
}: Props) {
  const { messages } = useChatMessages();
  if (!hasMessage(messages) && !showIfEmptyThread) return null;

  return (
    <div className={cn('relative flex flex-col items-center gap-2 w-full')}>
      {!autoScroll ? (
        <ScrollDownButton onClick={() => props.setAutoScroll(true)} />
      ) : null}
      <MessageComposer {...props} />
      <WaterMark />
    </div>
  );
}
