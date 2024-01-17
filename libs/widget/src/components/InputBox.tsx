import { memo, useCallback } from 'react';
import { useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import { Box } from '@mui/material';

import { useAuth } from '@chainlit/app/src/api/auth';
import ScrollDownButton from '@chainlit/app/src/components/atoms/buttons/scrollDownButton';
import { IAttachment } from '@chainlit/app/src/state/chat';
import { IProjectSettings } from '@chainlit/app/src/state/project';
import { inputHistoryState } from '@chainlit/app/src/state/userInputHistory';
import { FileSpec, IStep, useChatInteract } from '@chainlit/react-client';

import Input from './Input';

interface Props {
  fileSpec: FileSpec;
  onFileUpload: (payload: File[]) => void;
  onFileUploadError: (error: string) => void;
  setAutoScroll: (autoScroll: boolean) => void;
  autoScroll?: boolean;
  projectSettings?: IProjectSettings;
}

const InputBox = memo(
  ({
    fileSpec,
    onFileUpload,
    onFileUploadError,
    setAutoScroll,
    autoScroll,
    projectSettings
  }: Props) => {
    const setInputHistory = useSetRecoilState(inputHistoryState);

    const { user } = useAuth();
    const { sendMessage, replyMessage } = useChatInteract();

    const onSubmit = useCallback(
      async (msg: string, attachments?: IAttachment[]) => {
        const message: IStep = {
          threadId: '',
          id: uuidv4(),
          name: user?.identifier || 'User',
          type: 'user_message',
          output: msg,
          createdAt: new Date().toISOString()
        };

        setInputHistory((old) => {
          const MAX_SIZE = 50;
          const inputs = [...(old.inputs || [])];
          inputs.push({
            content: msg,
            createdAt: new Date().getTime()
          });

          return {
            ...old,
            inputs:
              inputs.length > MAX_SIZE
                ? inputs.slice(inputs.length - MAX_SIZE)
                : inputs
          };
        });

        const fileReferences = attachments
          ?.filter((a) => !!a.serverId)
          .map((a) => ({ id: a.serverId! }));

        setAutoScroll(true);
        sendMessage(message, fileReferences);
      },
      [user, projectSettings, sendMessage]
    );

    const onReply = useCallback(
      async (msg: string) => {
        const message: IStep = {
          threadId: '',
          id: uuidv4(),
          name: user?.identifier || 'User',
          type: 'user_message',
          output: msg,
          createdAt: new Date().toISOString()
        };

        replyMessage(message);
        setAutoScroll(true);
      },
      [user, replyMessage]
    );

    return (
      <Box display="flex" position="relative" flexDirection="column">
        {!autoScroll ? (
          <ScrollDownButton onClick={() => setAutoScroll(true)} />
        ) : null}
        <Input
          fileSpec={fileSpec}
          onFileUpload={onFileUpload}
          onFileUploadError={onFileUploadError}
          onSubmit={onSubmit}
          onReply={onReply}
        />
      </Box>
    );
  }
);

export { InputBox };
