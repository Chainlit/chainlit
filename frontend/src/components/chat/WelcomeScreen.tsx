import { cn, hasMessage } from '@/lib/utils';
import { useEffect, useState } from 'react';

import { FileSpec, useChatMessages } from '@chainlit/react-client';

import { Logo } from '@/components/Logo';

import MessageComposer from './MessageComposer';
import Starters from './Starters';

interface Props {
  fileSpec: FileSpec;
  onFileUpload: (payload: File[]) => void;
  onFileUploadError: (error: string) => void;
  setAutoScroll: (autoScroll: boolean) => void;
}

export default function WelcomeScreen(props: Props) {
  const { messages } = useChatMessages();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (hasMessage(messages)) return null;

  return (
    <div
      className={cn(
        'flex flex-col -mt-[60px] gap-4 w-full flex-grow items-center justify-center welcome-screen mx-auto transition-opacity duration-500 opacity-0 delay-100',
        isVisible && 'opacity-100'
      )}
    >
      <Logo className="w-[200px] mb-2" />
      <MessageComposer {...props} />
      <Starters />
    </div>
  );
}
