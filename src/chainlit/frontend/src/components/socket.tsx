import { wsEndpoint } from 'api';
import { memo, useEffect } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import {
  IMessage,
  IToken,
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
import { projectSettingsState } from 'state/project';

const compareMessageIds = (a: IMessage, b: IMessage) => {
  if (a.id && b.id) return a.id === b.id;
  if (a.tempId && b.tempId) return a.tempId === b.tempId;
  return false;
};

export default memo(function Socket() {
  const pSettings = useRecoilValue(projectSettingsState);
  const { accessToken, isAuthenticated, isLoading: _isLoading } = useAuth();
  const userEnv = useRecoilValue(userEnvState);
  const setLoading = useSetRecoilState(loadingState);
  const [session, setSession] = useRecoilState(sessionState);
  const setMessages = useSetRecoilState(messagesState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const setAskUser = useSetRecoilState(askUserState);
  const setElements = useSetRecoilState(elementState);
  const setActions = useSetRecoilState(actionState);

  const isLoading = pSettings?.project?.id && _isLoading;
  const authenticating = isLoading || (isAuthenticated && !accessToken);

  useEffect(() => {
    if (authenticating || !pSettings) return;

    if (session?.socket) {
      session.socket.removeAllListeners();
      session.socket.close();
    }

    const socket = io(wsEndpoint, {
      path: '/ws/socket.io',
      extraHeaders: {
        Authorization: accessToken || '',
        'user-env': JSON.stringify(userEnv)
      }
    });

    setSession({
      socket
    });

    socket.on('connect', () => {
      console.log('connected', socket.id);
      socket.emit('connection_successful');
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

    socket.on('new_message', (message: IMessage) => {
      setMessages((oldMessages) => {
        const index = oldMessages.findIndex((m) =>
          compareMessageIds(m, message)
        );
        if (index === -1) {
          return [...oldMessages, message];
        } else {
          return [
            ...oldMessages.slice(0, index),
            message,
            ...oldMessages.slice(index + 1)
          ];
        }
      });
    });

    socket.on('update_message', (message: IMessage) => {
      setMessages((oldMessages) => {
        const index = oldMessages.findIndex((m) =>
          compareMessageIds(m, message)
        );
        if (index === -1) return oldMessages;
        return [
          ...oldMessages.slice(0, index),
          message,
          ...oldMessages.slice(index + 1)
        ];
      });
    });

    socket.on('delete_message', (message: IMessage) => {
      setMessages((oldMessages) => {
        const index = oldMessages.findIndex((m) =>
          compareMessageIds(m, message)
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

    socket.on('stream_token', ({ id, token }: IToken) => {
      setMessages((oldMessages) => {
        const index = oldMessages.findIndex(
          (m) => (m.id && m.id === id) || (m.tempId && m.tempId === id)
        );
        if (index === -1) return oldMessages;
        const oldMessage = oldMessages[index];
        const newMessage = { ...oldMessage };
        newMessage.content += token;
        return [
          ...oldMessages.slice(0, index),
          newMessage,
          ...oldMessages.slice(index + 1)
        ];
      });
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
  }, [userEnv, authenticating, pSettings]);

  return null;
});
