import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import { UploadFile } from '@mui/icons-material';
import { Alert, Box, Stack, Typography } from '@mui/material';

import {
  ErrorBoundary,
  IFileResponse,
  IMessage,
  useChat,
  useUpload
} from '@chainlit/components';

import SideView from 'components/atoms/element/sideView';
import { Logo } from 'components/atoms/logo';
import ChatProfiles from 'components/molecules/chatProfiles';
import TaskList from 'components/molecules/tasklist';

import { useAuth } from 'hooks/auth';

import { attachmentsState } from 'state/chat';
import { chatHistoryState } from 'state/chatHistory';
import { conversationsHistoryState } from 'state/conversations';
import { projectSettingsState, sideViewState } from 'state/project';

import InputBox from './inputBox';
import MessageContainer from './message/container';

const Chat = () => {
  const pSettings = useRecoilValue(projectSettingsState);
  const [attachments, setAttachments] = useRecoilState(attachmentsState);
  const setChatHistory = useSetRecoilState(chatHistoryState);
  const setConversations = useSetRecoilState(conversationsHistoryState);
  const sideViewElement = useRecoilValue(sideViewState);

  const { user } = useAuth();
  const [autoScroll, setAutoScroll] = useState(true);

  const {
    sendMessage,
    replyMessage,
    callAction,
    tasklists,
    error,
    messages,
    actions,
    elements,
    askUser,
    avatars,
    loading,
    fileSpec,
    disabled
  } = useChat();

  const upload = useUpload({
    disabled,
    spec: fileSpec || { accept: ['*'], max_size_mb: 2, max_files: 1 },
    onResolved: (payloads: IFileResponse[]) => {
      const fileElements = payloads.map((file) => ({
        id: uuidv4(),
        type: 'file' as const,
        display: 'inline' as const,
        name: file.name,
        mime: file.type,
        content: file.content
      }));
      setAttachments((prev) => prev.concat(fileElements));
    },

    onError: (error) => toast.error(error),
    options: { noClick: true }
  });

  useEffect(() => {
    setConversations((prev) => ({
      ...prev,
      currentConversationId: undefined
    }));
  }, []);

  const onSubmit = useCallback(
    async (msg: string) => {
      const message: IMessage = {
        id: uuidv4(),
        author: user?.username || 'User',
        authorIsUser: true,
        content: msg,
        createdAt: new Date().toISOString(),
        elements: attachments
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
      sendMessage(message);
    },
    [user, pSettings, sendMessage]
  );

  const onReply = useCallback(
    async (msg: string) => {
      const message = {
        id: uuidv4(),
        author: user?.username || 'User',
        authorIsUser: true,
        content: msg,
        createdAt: new Date().toISOString(),
        elements: attachments
      };

      replyMessage(message);
      setAutoScroll(true);
    },
    [askUser, user, replyMessage]
  );

  const tasklist = tasklists.at(-1);

  return (
    <Box
      {...upload?.getRootProps({ className: 'dropzone' })}
      display="flex"
      width="100%"
      flexGrow={1}
      position="relative"
    >
      {upload ? (
        <>
          <input {...upload.getInputProps()} />
          {upload?.isDragActive ? (
            <Stack
              sx={{
                position: 'absolute',
                backgroundColor: (theme) => theme.palette.primary.main,
                color: 'white',
                height: '100%',
                width: '100%',
                opacity: 0.8,
                zIndex: 10,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <UploadFile sx={{ height: 50, width: 50 }} />
              <Typography fontSize={'20px'}>Drop your files here!</Typography>
            </Stack>
          ) : null}
        </>
      ) : null}
      <SideView>
        <TaskList tasklist={tasklist} isMobile={true} />
        <Box my={1} />
        {error && (
          <Alert id="session-error" severity="error">
            Could not reach the server.
          </Alert>
        )}
        <ErrorBoundary>
          <ChatProfiles />
          <MessageContainer
            avatars={avatars}
            loading={loading}
            askUser={askUser}
            actions={actions}
            elements={elements}
            messages={messages}
            autoScroll={autoScroll}
            callAction={callAction}
            setAutoScroll={setAutoScroll}
          />
          <InputBox onReply={onReply} onSubmit={onSubmit} />
          <Logo
            style={{
              width: '200px',
              height: '200px',
              objectFit: 'contain',
              position: 'absolute',
              pointerEvents: 'none',
              top: '45%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              filter: 'grayscale(100%)',
              opacity: messages.length > 0 ? 0 : 0.5,
              transition:
                messages.length > 0
                  ? 'opacity 0.2s ease-in-out'
                  : 'opacity 0.2s ease-in-out'
            }}
          />
        </ErrorBoundary>
      </SideView>
      {sideViewElement ? null : (
        <TaskList tasklist={tasklist} isMobile={false} />
      )}
    </Box>
  );
};

export default Chat;
