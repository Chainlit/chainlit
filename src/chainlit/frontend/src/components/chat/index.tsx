import { Alert, Box } from '@mui/material';
import MessageContainer from './message/container';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  IMessage,
  askUserState,
  messagesState,
  sessionState
} from 'state/chat';
import Playground from 'components/playground';
import SideView from 'components/element/sideView';
import InputBox from './inputBox';
import { useCallback, useState } from 'react';
import { projectSettingsState } from 'state/project';
import { useAuth } from 'hooks/auth';
import useLocalChatHistory from 'hooks/localChatHistory';
import { actionState } from 'state/action';
import WelcomeScreen from 'components/chat/welcomeScreen';
import { elementState } from 'state/element';
import ErrorBoundary from 'components/errorBoundary';

const Chat = () => {
  const { user, isAuthenticated } = useAuth();
  const session = useRecoilValue(sessionState);
  const askUser = useRecoilValue(askUserState);
  const [messages, setMessages] = useRecoilState(messagesState);
  const elements = useRecoilValue(elementState);
  const actions = useRecoilValue(actionState);
  const pSettings = useRecoilValue(projectSettingsState);
  const { persistChatLocally } = useLocalChatHistory();
  const [autoScroll, setAutoScroll] = useState(true);

  const onSubmit = useCallback(
    async (msg: string) => {
      const sessionId = session?.socket.id;

      if (!sessionId) {
        return;
      }

      const message: IMessage = {
        author: user?.name || 'User',
        authorIsUser: true,
        content: msg,
        createdAt: Date.now()
      };

      if (!isAuthenticated || !pSettings?.project?.id) {
        persistChatLocally(msg);
      }

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
        author: user?.name || 'User',
        authorIsUser: true,
        content: msg,
        createdAt: Date.now()
      };

      askUser.callback({ author: message.author, content: message.content });

      setAutoScroll(true);
      setMessages((oldMessages) => [...oldMessages, message]);
    },
    [askUser, user]
  );

  return (
    <Box display="flex" width="100%" height="0" flexGrow={1}>
      <Playground />
      <Box
        display="flex"
        flexDirection="column"
        width="100%"
        boxSizing="border-box"
        px={2}
      >
        <Box my={1} />
        {session?.error && (
          <Alert severity="error">Could not reach the server.</Alert>
        )}
        {!!messages.length && (
          <ErrorBoundary>
            <MessageContainer
              actions={actions}
              elements={elements}
              messages={messages}
              autoScroll={autoScroll}
              setAutoSroll={setAutoScroll}
            />
          </ErrorBoundary>
        )}
        {!messages.length && <WelcomeScreen />}
        <InputBox onReply={onReply} onSubmit={onSubmit} />
      </Box>
      <SideView />
    </Box>
  );
};

export default Chat;
