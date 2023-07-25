import { wsEndpoint } from 'api';
import { deepEqual } from 'helpers/object';
import { memo, useEffect } from 'react';
import {
  useRecoilState,
  useRecoilValue,
  useResetRecoilState,
  useSetRecoilState
} from 'recoil';
import io from 'socket.io-client';

import { useAuth } from 'hooks/auth';

import { IAction, actionState } from 'state/action';
import {
  IMessage,
  IMessageUpdate,
  IToken,
  askUserState,
  chatSettingsState,
  chatSettingsValueState,
  loadingState,
  messagesState,
  sessionState,
  tokenCountState
} from 'state/chat';
import {
  IElement,
  avatarState,
  elementState,
  tasklistState
} from 'state/element';
import { projectSettingsState } from 'state/project';
import { sessionIdState, userEnvState } from 'state/user';

import { TFormInput } from './organisms/FormInput';

const compareMessageIds = (a: IMessage, b: IMessage) => {
  if (a.id && b.id) return a.id === b.id;
  return false;
};

export default memo(function Socket() {
  const pSettings = useRecoilValue(projectSettingsState);
  const { accessToken, authenticating } = useAuth();
  const userEnv = useRecoilValue(userEnvState);
  const setLoading = useSetRecoilState(loadingState);
  const sessionId = useRecoilValue(sessionIdState);
  const [session, setSession] = useRecoilState(sessionState);
  const setMessages = useSetRecoilState(messagesState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const setAskUser = useSetRecoilState(askUserState);
  const setElements = useSetRecoilState(elementState);
  const setAvatars = useSetRecoilState(avatarState);
  const setTasklists = useSetRecoilState(tasklistState);
  const setActions = useSetRecoilState(actionState);
  const setChatSettings = useSetRecoilState(chatSettingsState);
  const resetChatSettingsValue = useResetRecoilState(chatSettingsValueState);

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
        'X-Chainlit-Session-Id': sessionId,
        'user-env': JSON.stringify(userEnv)
      }
    });

    setSession({
      socket
    });

    socket.on('connect', () => {
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
      socket.emit('clear_session');
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

    socket.on('update_message', (message: IMessageUpdate) => {
      setMessages((oldMessages) => {
        const index = oldMessages.findIndex((m) =>
          compareMessageIds(m, message)
        );
        if (index === -1) return oldMessages;
        if (message.newId) {
          message.id = message.newId;
          delete message.newId;
        }

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

    socket.on('stream_token', ({ id, token, isSequence }: IToken) => {
      setMessages((oldMessages) => {
        const index = oldMessages.findIndex((m) => m.id === id);
        if (index === -1) return oldMessages;
        const oldMessage = oldMessages[index];
        const newMessage = { ...oldMessage };
        if (isSequence) {
          newMessage.content = token;
        } else {
          newMessage.content += token;
        }
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

    socket.on('chat_settings', (inputs: TFormInput[]) => {
      setChatSettings((old) => ({ ...old, inputs }));
      resetChatSettingsValue();
    });

    socket.on('element', (element: IElement) => {
      if (element.type === 'avatar') {
        setAvatars((old) => [...old, element]);
      } else if (element.type === 'tasklist') {
        setTasklists((old) => [...old, element]);
      } else {
        setElements((old) => [...old, element]);
      }
    });

    socket.on('update_element', (update: { id: string; forIds: string[] }) => {
      setElements((old) => {
        const index = old.findIndex((e) => e.id === update.id);
        if (index === -1) return old;
        const element = old[index];
        const newElement = { ...element, forIds: update.forIds };
        return [...old.slice(0, index), newElement, ...old.slice(index + 1)];
      });
    });

    socket.on('remove_element', (remove: { id: string }) => {
      setElements((old) => {
        return old.filter((e) => e.id !== remove.id);
      });
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
