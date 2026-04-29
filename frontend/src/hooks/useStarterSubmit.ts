import { useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import {
  IStarter,
  IStep,
  modesState,
  useAuth,
  useChatData,
  useChatInteract
} from '@chainlit/react-client';

import { persistentCommandState } from '@/state/chat';

export function useStarterSubmit(starter: IStarter) {
  const selectedCommand = useRecoilValue(persistentCommandState);
  const modes = useRecoilValue(modesState);
  const { sendMessage } = useChatInteract();
  const { loading, connected } = useChatData();
  const { user } = useAuth();

  const disabled = loading || !connected;

  const onSubmit = useCallback(async () => {
    const modesDict: Record<string, string> = {};
    modes.forEach((mode) => {
      const defaultOpt = mode.options.find((opt) => opt.default);
      const selectedId = defaultOpt?.id || mode.options[0]?.id;
      if (selectedId) {
        modesDict[mode.id] = selectedId;
      }
    });

    const message: IStep = {
      threadId: '',
      id: uuidv4(),
      command: starter.command ?? selectedCommand?.id,
      modes: Object.keys(modesDict).length > 0 ? modesDict : undefined,
      name: user?.identifier || 'User',
      type: 'user_message',
      output: starter.message,
      createdAt: new Date().toISOString(),
      metadata: { location: window.location.href }
    };

    sendMessage(message, []);
  }, [user, selectedCommand, modes, sendMessage, starter]);

  return { onSubmit, disabled };
}
