import { getProjectSettings, postMessage, server } from 'api';
import { Alert, Box } from '@mui/material';
import MessageContainer from './message/container';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import {
  IMessage,
  askUserState,
  loadingState,
  messagesState,
  sessionState,
  tokenCountState
} from 'state/chat';
import Playground from 'components/playground';
import SideView from 'components/element/sideView';
import InputBox from './inputBox';
import { useCallback, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-hot-toast';
import useClearChat from 'hooks/clearChat';
import { userEnvState } from 'state/user';
import { IElement, elementState } from 'state/element';
import { projectSettingsState } from 'state/project';
import { useAuth } from 'hooks/auth';
import useLocalChatHistory from 'hooks/localChatHistory';
import { IAction, actionState } from 'state/action';
import WelcomeScreen from 'components/chat/welcomeScreen';

const Chat = () => {
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();
  const [session, setSession] = useRecoilState(sessionState);
  const [askUser, setAskUser] = useRecoilState(askUserState);
  const userEnv = useRecoilValue(userEnvState);
  const [messages, setMessages] = useRecoilState(messagesState);
  const setLoading = useSetRecoilState(loadingState);
  const [elements, setElements] = useRecoilState(elementState);
  const [actions, setActions] = useRecoilState(actionState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const [pSettings, setPSettings] = useRecoilState(projectSettingsState);
  const clearChat = useClearChat();
  const { persistChatLocally } = useLocalChatHistory();
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (isLoading || (isAuthenticated && !accessToken)) return;

    if (session?.socket) {
      return;
    }

    const socket = io(server, {
      extraHeaders: {
        Authorization: accessToken || '',
        'user-env': JSON.stringify(userEnv)
      }
    });

    setSession({
      socket
    });

    socket.on('connect', () => {
      console.log('connected');
      setSession((s) => ({ ...s!, error: false }));
    });

    socket.on('connect_error', (err) => {
      console.error('failed to connect', err);
      setSession((s) => ({ ...s!, error: true }));
    });

    socket.on('task_start', () => {
      setLoading(true);
    });

    socket.on('task_end', () => {
      setLoading(false);
    });

    socket.on('reload', () => {
      clearChat();
      getProjectSettings().then((res) => setPSettings(res));
    });

    socket.on('message', (message: IMessage) => {
      setMessages((oldMessages) => [...oldMessages, message]);
    });

    socket.on('stream_start', (message: IMessage) => {
      setMessages((oldMessages) => [...oldMessages, message]);
    });

    socket.on('stream_token', (token: string) => {
      setMessages((oldMessages) => {
        const lastMessage = { ...oldMessages[oldMessages.length - 1] };
        lastMessage.content += token;
        return [...oldMessages.slice(0, -1), lastMessage];
      });
    });

    socket.on('stream_end', (message: IMessage) => {
      setMessages((oldMessages) => [...oldMessages.slice(0, -1), message]);
    });

    socket.on('ask', ({ msg, spec }, callback) => {
      setAskUser({ spec, callback });
      setMessages((oldMessages) => [...oldMessages, msg]);
      setLoading(false);
    });

    socket.on('ask_timeout', () => {
      setAskUser(undefined);
      setLoading(false);
    });

    socket.on('element', (element: IElement) => {
      setElements((old) => ({
        ...old,
        ...{ [element.name]: element }
      }));
    });

    socket.on('action', (action: IAction) => {
      setActions((old) => ({
        ...old,
        ...{ [action.name]: action }
      }));
    });

    socket.on('token_usage', (count: number) => {
      setTokenCount((old) => old + count);
    });
  }, [userEnv, accessToken, isAuthenticated, isLoading]);

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

      if (!isAuthenticated || !pSettings?.projectId) {
        persistChatLocally(msg);
      }

      setAutoScroll(true);
      setMessages((oldMessages) => [...oldMessages, message]);
      try {
        await postMessage(sessionId, message.author, msg);
      } catch (err) {
        if (err instanceof Error) {
          toast.error(err.message);
        }
      }
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
      setAskUser(undefined);
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
          <MessageContainer
            actions={actions}
            elements={elements}
            messages={messages}
            autoScroll={autoScroll}
            setAutoSroll={setAutoScroll}
          />
        )}
        {!messages.length && <WelcomeScreen />}
        <InputBox onReply={onReply} onSubmit={onSubmit} />
      </Box>
      <SideView />
    </Box>
  );
};

export default Chat;
