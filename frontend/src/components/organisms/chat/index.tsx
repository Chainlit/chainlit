import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import { Alert, Box } from '@mui/material';

import {
  ErrorBoundary,
  IFileElement,
  IFileResponse,
  IMessage,
  useChat,
  useUpload
} from '@chainlit/components';

import SideView from 'components/atoms/element/sideView';
import ChatProfiles from 'components/molecules/chatProfiles';
import TaskList from 'components/molecules/tasklist';

import { useAuth } from 'hooks/auth';

import { attachmentsState } from 'state/chat';
import { chatHistoryState } from 'state/chatHistory';
import { conversationsHistoryState } from 'state/conversations';
import { projectSettingsState, sideViewState } from 'state/project';

import DropScreen from './dropScreen';
import InputBox from './inputBox';
import MessageContainer from './message/container';
import WelcomeScreen from './welcomeScreen';

const Chat = () => {
  const pSettings = useRecoilValue(projectSettingsState);
  const setAttachments = useSetRecoilState(attachmentsState);
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
    disabled
  } = useChat();

  const fileSpec = { max_size_mb: 20 };
  const onFileUpload = (payloads: IFileResponse[]) => {
    const fileElements = payloads.map((file) => ({
      id: uuidv4(),
      type: 'file' as const,
      display: 'inline' as const,
      name: file.name,
      mime: file.type,
      content: file.content
    }));
    setAttachments((prev) => prev.concat(fileElements));
  };

  const onFileUploadError = (error: string) => toast.error(error);

  const upload = useUpload({
    spec: fileSpec,
    onResolved: onFileUpload,
    onError: onFileUploadError,
    options: { noClick: true }
  });

  useEffect(() => {
    setConversations((prev) => ({
      ...prev,
      currentConversationId: undefined
    }));
  }, []);

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
    [user, pSettings, sendMessage]
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
    [askUser, user, replyMessage]
  );

  const tasklist = tasklists[tasklists.length - 1];
  const enableMultiModalUpload = !disabled && pSettings?.features?.multi_modal;

  return (
    <Box
      {...(enableMultiModalUpload
        ? upload?.getRootProps({ className: 'dropzone' })
        : {})}
      // Disable the onFocus and onBlur events in react-dropzone to avoid interfering with child trigger events
      onBlur={undefined}
      onFocus={undefined}
      display="flex"
      width="100%"
      flexGrow={1}
      position="relative"
    >
      {upload ? (
        <>
          <input id="#upload-drop-input" {...upload.getInputProps()} />
          {upload?.isDragActive ? <DropScreen /> : null}
        </>
      ) : null}
      <SideView>
        <Box my={1} />
        {error && (
          <Box
            sx={{
              width: '100%',
              maxWidth: '60rem',
              mx: 'auto',
              my: 2
            }}
          >
            <Alert sx={{ mx: 2 }} id="session-error" severity="error">
              Could not reach the server.
            </Alert>
          </Box>
        )}
        <TaskList tasklist={tasklist} isMobile={true} />
        <ErrorBoundary>
          <ChatProfiles />
          {!messages.length && pSettings?.ui.show_readme_as_default ? (
            <WelcomeScreen />
          ) : (
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
          )}
          <InputBox
            fileSpec={fileSpec}
            onFileUpload={onFileUpload}
            onFileUploadError={onFileUploadError}
            onReply={onReply}
            onSubmit={onSubmit}
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
