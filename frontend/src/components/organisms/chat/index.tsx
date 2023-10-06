import { useCallback, useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import { Alert, Box } from '@mui/material';

import { ErrorBoundary, IMessage } from '@chainlit/components';
import { useChat } from '@chainlit/components';

import SideView from 'components/atoms/element/sideView';
import TaskList from 'components/molecules/tasklist';

import { useAuth } from 'hooks/auth';

import { chatHistoryState } from 'state/chatHistory';
import { projectSettingsState, sideViewState } from 'state/project';

import InputBox from './inputBox';
import MessageContainer from './message/container';
import WelcomeScreen from './welcomeScreen';

const Chat = () => {
  const { user } = useAuth();
  const pSettings = useRecoilValue(projectSettingsState);
  const sideViewElement = useRecoilValue(sideViewState);
  const setChatHistory = useSetRecoilState(chatHistoryState);
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
    <Box display="flex" width="100%" height="0" flexGrow={1}>
      <SideView>
        <TaskList tasklist={tasklist} isMobile={true} />
        <Box my={1} />
        {error && (
          <Alert id="session-error" severity="error">
            Could not reach the server.
          </Alert>
        )}
        <ErrorBoundary>
          {!!messages.length && (
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
          {!messages.length && <WelcomeScreen />}
          <InputBox onReply={onReply} onSubmit={onSubmit} />
        </ErrorBoundary>
      </SideView>
      {sideViewElement ? null : (
        <TaskList tasklist={tasklist} isMobile={false} />
      )}
    </Box>
  );
};

export default Chat;
