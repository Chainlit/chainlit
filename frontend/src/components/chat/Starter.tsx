import { useCallback, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';

import {
  ChainlitContext,
  IStarter,
  IStep,
  useAuth,
  useChatData,
  useChatInteract
} from '@chainlit/react-client';

import { Button } from '@/components/ui/button';

interface StarterProps {
  starter: IStarter;
}

export default function Starter({ starter }: StarterProps) {
  const apiClient = useContext(ChainlitContext);
  const { sendMessage } = useChatInteract();
  const { loading } = useChatData();
  const { user } = useAuth();

  const onSubmit = useCallback(async () => {
    const message: IStep = {
      threadId: '',
      id: uuidv4(),
      name: user?.identifier || 'User',
      type: 'user_message',
      output: starter.message,
      createdAt: new Date().toISOString()
    };

    sendMessage(message, []);
  }, [user, sendMessage, starter]);

  return (
    <Button
      id={`starter-${starter.label.trim().toLowerCase().replaceAll(' ', '-')}`}
      variant="outline"
      className="w-fit justify-start rounded-3xl"
      disabled={loading}
      onClick={onSubmit}
    >
      <div className="flex gap-2">
        {starter.icon ? (
          <img
            className="h-5 w-5 rounded-md"
            src={
              starter.icon?.startsWith('/public')
                ? apiClient.buildEndpoint(starter.icon)
                : starter.icon
            }
            alt={starter.label}
          />
        ) : null}
        <p className="text-sm text-muted-foreground truncate">
          {starter.label}
        </p>
      </div>
    </Button>
  );
}
