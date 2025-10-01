import { cn } from '@/lib/utils';
import { useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import {
  IStarter,
  IStep,
  useAuth,
  useChatData,
  useChatInteract
} from '@chainlit/react-client';

import Icon from '@/components/Icon';
import { Button } from '@/components/ui/button';

import { persistentCommandState } from '@/state/chat';

interface StarterProps {
  starter: IStarter;
}

export default function Starter({ starter }: StarterProps) {
  const selectedCommand = useRecoilValue(persistentCommandState);
  const { sendMessage } = useChatInteract();
  const { loading, connected } = useChatData();
  const { user } = useAuth();

  const disabled = loading || !connected;

  const onSubmit = useCallback(async () => {
    const message: IStep = {
      threadId: '',
      id: uuidv4(),
      command: starter.command ?? selectedCommand?.id,
      name: user?.identifier || 'User',
      type: 'user_message',
      output: starter.message,
      createdAt: new Date().toISOString(),
      metadata: { location: window.location.href }
    };

    sendMessage(message, []);
  }, [user, selectedCommand, sendMessage, starter]);

  return (
    <Button
      id={`starter-${starter.label.trim().toLowerCase().replaceAll(' ', '-')}`}
      variant="outline"
      className="w-fit justify-start rounded-3xl"
      disabled={disabled}
      onClick={onSubmit}
    >
      <div className="flex gap-2">
        {starter.icon ? (
          <Icon
            name={starter.icon}
            className={cn('!h-5 !w-5 text-muted-foreground rounded-md')}
          />
        ) : null}
        <p className="text-sm text-muted-foreground truncate">
          {starter.label}
        </p>
      </div>
    </Button>
  );
}
