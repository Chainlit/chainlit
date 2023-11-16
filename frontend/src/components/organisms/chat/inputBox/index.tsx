import { useAuth } from 'api/auth';
import { memo, useCallback } from 'react';
import { useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import { Box } from '@mui/material';

import {
  FileSpec,
  IFileElement,
  IFileResponse,
  IMessage,
  useChatInteract
} from '@chainlit/react-client';

import { chatHistoryState } from 'state/chatHistory';
import { IProjectSettings } from 'state/project';

import StopButton from '../stopButton';
import Input from './input';
import WaterMark from './waterMark';

interface Props {
  fileSpec: FileSpec;
  onFileUpload: (payload: IFileResponse[]) => void;
  onFileUploadError: (error: string) => void;
  setAutoScroll: (autoScroll: boolean) => void;
  projectSettings?: IProjectSettings;
}

const InputBox = memo(
  ({
    fileSpec,
    onFileUpload,
    onFileUploadError,
    setAutoScroll,
    projectSettings
  }: Props) => {
    const setChatHistory = useSetRecoilState(chatHistoryState);

    const { user } = useAuth();
    const { sendMessage, replyMessage } = useChatInteract();
    // const tokenCount = useRecoilValue(tokenCountState);

    const onSubmit = useCallback(
      async (msg: string, files?: IFileElement[]) => {
        const message: IMessage = {
          id: uuidv4(),
          author: user?.username || 'User',
          authorIsUser: true,
          content: msg,
          createdAt: new Date().toISOString()
        };

        setChatHistory((old) => {
          const MAX_SIZE = 50;
          const messages = [...(old.messages || [])];
          messages.push({
            content: msg,
            createdAt: new Date().getTime()
          });

          return {
            ...old,
            messages:
              messages.length > MAX_SIZE
                ? messages.slice(messages.length - MAX_SIZE)
                : messages
          };
        });

        setAutoScroll(true);
        sendMessage(message, files);
      },
      [user, projectSettings, sendMessage]
    );

    const onReply = useCallback(
      async (msg: string) => {
        const message = {
          id: uuidv4(),
          author: user?.username || 'User',
          authorIsUser: true,
          content: msg,
          createdAt: new Date().toISOString()
        };

        replyMessage(message);
        setAutoScroll(true);
      },
      [user, replyMessage]
    );

    return (
      <Box
        display="flex"
        flexDirection="column"
        gap={1}
        p={2}
        sx={{
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '60rem',
          m: 'auto',
          justifyContent: 'center'
        }}
      >
        <StopButton />
        <Box>
          <Input
            fileSpec={fileSpec}
            onFileUpload={onFileUpload}
            onFileUploadError={onFileUploadError}
            onSubmit={onSubmit}
            onReply={onReply}
          />
          {/* {tokenCount > 0 && ( */}
          {/* <Stack flexDirection="row" alignItems="center">
          <Typography
            sx={{ ml: 'auto' }}
            color="text.secondary"
            variant="caption"
          >
            Token usage: {tokenCount}
          </Typography>
        </Stack> */}
          {/* )} */}
        </Box>
        <WaterMark />
      </Box>
    );
  }
);

export default InputBox;
