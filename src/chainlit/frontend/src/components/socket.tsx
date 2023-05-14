import useClearChat from 'hooks/clearChat';
import { getProjectSettings, server } from 'api';
import { memo, useEffect } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import {
  IMessage,
  askUserState,
  loadingState,
  messagesState,
  sessionState,
  tokenCountState
} from 'state/chat';
import { userEnvState } from 'state/user';
import { useAuth } from 'hooks/auth';
import io from 'socket.io-client';
import { projectSettingsState } from 'state/project';
import { IElement, elementState } from 'state/element';
import { IAction, actionState } from 'state/action';

export default memo(function Socket() {
  const { accessToken, isAuthenticated, isLoading } = useAuth();
  const userEnv = useRecoilValue(userEnvState);
  const setLoading = useSetRecoilState(loadingState);
  const [session, setSession] = useRecoilState(sessionState);
  const setPSettings = useSetRecoilState(projectSettingsState);
  const setMessages = useSetRecoilState(messagesState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const setAskUser = useSetRecoilState(askUserState);
  const setElements = useSetRecoilState(elementState);
  const setActions = useSetRecoilState(actionState);
  const clearChat = useClearChat();

  const authenticating = isLoading || (isAuthenticated && !accessToken);

  useEffect(() => {
    if (authenticating) return;

    if (session?.socket) {
      session.socket.removeAllListeners();
      session.socket.close();
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
  }, [userEnv, authenticating]);

  return null;
});
