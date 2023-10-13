import { useCallback, useEffect, useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import { Alert, Box } from '@mui/material';

import { ErrorBoundary, IMessage, useChat } from '@chainlit/components';

import SideView from 'components/atoms/element/sideView';
import { Logo } from 'components/atoms/logo';
import ChatProfiles from 'components/molecules/chatProfiles';
import TaskList from 'components/molecules/tasklist';

import { useAuth } from 'hooks/auth';

import { chatHistoryState } from 'state/chatHistory';
import { conversationsHistoryState } from 'state/conversations';
import { projectSettingsState, sideViewState } from 'state/project';

import InputBox from './inputBox';
import MessageContainer from './message/container';

const Chat = () => {
  const { user } = useAuth();
  const pSettings = useRecoilValue(projectSettingsState);
  const sideViewElement = useRecoilValue(sideViewState);
  const setChatHistory = useSetRecoilState(chatHistoryState);
  const setConversations = useSetRecoilState(conversationsHistoryState);
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
    loading
  } = useChat();

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
        createdAt: new Date().toISOString()
      };

      replyMessage(message);
      setAutoScroll(true);
    },
    [askUser, user, replyMessage]
  );

  const tasklist = tasklists.at(-1);

  return (
    <Box display="flex" width="100%" flexGrow={1} position="relative">
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
