import { cn, hasMessage } from '@/lib/utils';
import { MutableRefObject } from 'react';

import { FileSpec, useChatMessages } from '@chainlit/react-client';

import MessageComposer from './MessageComposer';

interface Props {
  fileSpec: FileSpec;
  onFileUpload: (payload: File[]) => void;
  onFileUploadError: (error: string) => void;
  autoScrollRef: MutableRefObject<boolean>;
  showIfEmptyThread?: boolean;
}

export default function ChatFooter({ showIfEmptyThread, ...props }: Props) {
  const { messages } = useChatMessages();
  if (!hasMessage(messages) && !showIfEmptyThread) return null;

  return (
    <div className={cn('relative flex flex-col items-center gap-2 w-full')}>
      <MessageComposer {...props} />
    </div>
  );
}
