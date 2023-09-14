import { useCallback, useState } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import { Alert, Box } from '@mui/material';

import { IMessage } from '@chainlit/components';

import SideView from 'components/atoms/element/sideView';
import ErrorBoundary from 'components/atoms/errorBoundary';
import TaskList from 'components/molecules/tasklist';

import { useAuth } from 'hooks/auth';

import { actionState } from 'state/action';
import { askUserState, messagesState, sessionState } from 'state/chat';
import { chatHistoryState } from 'state/chatHistory';
import { elementState, tasklistState } from 'state/element';
import { projectSettingsState } from 'state/project';

import InputBox from './inputBox';
import MessageContainer from './message/container';
import WelcomeScreen from './welcomeScreen';

const Chat = () => {
  const { user, isAuthenticated } = useAuth();
  const session = useRecoilValue(sessionState);
  const askUser = useRecoilValue(askUserState);
  const [messages, setMessages] = useRecoilState(messagesState);
  const tasklistElements = useRecoilValue(tasklistState);
  const pSettings = useRecoilValue(projectSettingsState);
  const actions = useRecoilValue(actionState);
  const elements = useRecoilValue(elementState);
  const setChatHistory = useSetRecoilState(chatHistoryState);
  const [autoScroll, setAutoScroll] = useState(true);

  const onSubmit = useCallback(
    async (msg: string) => {
      const sessionId = session?.socket.id;

      if (!sessionId) {
        return;
      }

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
      setMessages((oldMessages) => [...oldMessages, message]);
      session?.socket.emit('ui_message', message);
    },
    [user, session, isAuthenticated, pSettings]
  );

  const onReply = useCallback(
    async (msg: string) => {
      if (!askUser) return;
      const message = {
        id: uuidv4(),
        author: user?.username || 'User',
        authorIsUser: true,
        content: msg,
        createdAt: new Date().toISOString()
      };

      askUser.callback(message);

      setAutoScroll(true);
      setMessages((oldMessages) => [...oldMessages, message]);
    },
    [askUser, user]
  );

  const tasklist = tasklistElements.at(-1);

  return (
    <Box display="flex" width="100%" height="0" flexGrow={1}>
      <TaskList tasklist={tasklist} isMobile={false} />
      <SideView>
        <TaskList tasklist={tasklist} isMobile={true} />
        <Box my={1} />
        {session?.error && (
          <Alert id="session-error" severity="error">
            Could not reach the server.
          </Alert>
        )}
        <ErrorBoundary>
          {!!messages.length && (
            <MessageContainer
              actions={actions}
              elements={elements}
              messages={messages}
              autoScroll={autoScroll}
              setAutoScroll={setAutoScroll}
            />
          )}
          {!messages.length && <WelcomeScreen />}
          <InputBox onReply={onReply} onSubmit={onSubmit} />
        </ErrorBoundary>
      </SideView>
    </Box>
  );
};

export default Chat;
