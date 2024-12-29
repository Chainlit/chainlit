import { useEffect, useState } from 'react';

import Starters from '@chainlit/app/src/components/chat/Starters';
import { cn, hasMessage } from '@chainlit/app/src/lib/utils';
import { useChatMessages } from '@chainlit/react-client';

export default function WelcomeScreen() {
  const { messages } = useChatMessages();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (hasMessage(messages)) return null;

  return (
    <div
      className={cn(
        'flex flex-col pb-4 flex-grow welcome-screen transition-opacity duration-500 opacity-0 delay-100',
        isVisible && 'opacity-100'
      )}
    >
      <Starters className="items-end mt-auto" />
    </div>
  );
}
