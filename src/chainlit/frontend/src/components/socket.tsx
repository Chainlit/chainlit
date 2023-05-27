import { server } from 'api';
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
import { IElement, elementState } from 'state/element';
import { IAction, actionState } from 'state/action';
import { deepEqual } from 'helpers/object';

export default memo(function Socket() {
  const { accessToken, isAuthenticated, isLoading } = useAuth();
  const userEnv = useRecoilValue(userEnvState);
  const setLoading = useSetRecoilState(loadingState);
  const [session, setSession] = useRecoilState(sessionState);
  const setMessages = useSetRecoilState(messagesState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const setAskUser = useSetRecoilState(askUserState);
  const setElements = useSetRecoilState(elementState);
  const setActions = useSetRecoilState(actionState);
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
      window.location.reload();
    });

    socket.on('message', (message: IMessage) => {
      setMessages((oldMessages) => [...oldMessages, message]);
    });

    socket.on('update_message', (message: IMessage) => {
      setMessages((oldMessages) => {
        const index = oldMessages.findIndex(
          (m) => m.id === message.id || m.tempId === message.tempId
        );
        if (index === -1) return oldMessages;
        return [
          ...oldMessages.slice(0, index),
          message,
          ...oldMessages.slice(index + 1)
        ];
      });
    });

    socket.on('delete_message', ({ messageId }: any) => {
      setMessages((oldMessages) => {
        const index = oldMessages.findIndex(
          (m) => m.id === messageId || m.tempId === messageId
        );
        if (index === -1) return oldMessages;
        return [
          ...oldMessages.slice(0, index),
          ...oldMessages.slice(index + 1)
        ];
      });
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

    socket.on('clear_ask', () => {
      setAskUser(undefined);
    });

    socket.on('element', (element: IElement) => {
      setElements((old) => [...old, element]);
    });

    socket.on('action', (action: IAction) => {
      setActions((old) => [...old, action]);
    });

    socket.on('remove_action', (action: IAction) => {
      setActions((old) => {
        const index = old.findIndex((a) => deepEqual(a, action));
        if (index === -1) return old;
        return [...old.slice(0, index), ...old.slice(index + 1)];
      });
    });

    socket.on('token_usage', (count: number) => {
      setTokenCount((old) => old + count);
    });
  }, [userEnv, authenticating]);

  return null;
});
