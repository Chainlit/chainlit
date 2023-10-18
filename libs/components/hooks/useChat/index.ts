import { debounce } from 'lodash';
import { useCallback } from 'react';
import {
  useRecoilState,
  useRecoilValue,
  useResetRecoilState,
  useSetRecoilState
} from 'recoil';
import io from 'socket.io-client';
import { TFormInput } from 'src/inputs';
import { IAction, IElement, IFileElement, IMessage } from 'src/types';
import { nestMessages } from 'utils/message';

import {
  actionState,
  askUserState,
  avatarState,
  chatSettingsDefaultValueSelector,
  chatSettingsInputsState,
  chatSettingsValueState,
  elementState,
  firstUserMessageState,
  loadingState,
  messagesState,
  sessionIdState,
  sessionState,
  tasklistState,
  tokenCountState
} from './state';

export interface IMessageUpdate extends IMessage {
  newId?: string;
}

export interface IToken {
  id: number | string;
  token: string;
  isSequence: boolean;
}

const compareMessageIds = (a: IMessage, b: IMessage) => {
  if (a.id && b.id) return a.id === b.id;
  return false;
};

const useChat = () => {
  const sessionId = useRecoilValue(sessionIdState);
  const [firstUserMessage, setFirstUserMessage] = useRecoilState(
    firstUserMessageState
  );
  const [session, setSession] = useRecoilState(sessionState);
  const [loading, setLoading] = useRecoilState(loadingState);
  const [rawMessages, setMessages] = useRecoilState(messagesState);
  const [askUser, setAskUser] = useRecoilState(askUserState);
  const [elements, setElements] = useRecoilState(elementState);
  const [avatars, setAvatars] = useRecoilState(avatarState);
  const [tasklists, setTasklists] = useRecoilState(tasklistState);
  const [actions, setActions] = useRecoilState(actionState);
  const [chatSettingsInputs, setChatSettingsInputs] = useRecoilState(
    chatSettingsInputsState
  );
  const chatSettingsValue = useRecoilValue(chatSettingsValueState);
  const chatSettingsDefaultValue = useRecoilValue(
    chatSettingsDefaultValueSelector
  );
  const resetChatSettingsValue = useResetRecoilState(chatSettingsValueState);
  const resetChatSettings = useResetRecoilState(chatSettingsInputsState);
  const resetSessionId = useResetRecoilState(sessionIdState);
  const setTokenCount = useSetRecoilState(tokenCountState);

  const _connect = useCallback(
    ({
      wsEndpoint,
      userEnv,
      accessToken,
      chatProfile
    }: {
      wsEndpoint: string;
      userEnv: Record<string, string>;
      accessToken?: string;
      chatProfile?: string;
    }) => {
      const socket = io(wsEndpoint, {
        path: '/ws/socket.io',
        extraHeaders: {
          Authorization: accessToken || '',
          'X-Chainlit-Session-Id': sessionId,
          'user-env': JSON.stringify(userEnv),
          'X-Chainlit-Chat-Profile': chatProfile || ''
        }
      });
      setSession((old) => {
        old?.socket?.removeAllListeners();
        old?.socket?.close();
        return {
          socket
        };
      });

      socket.on('connect', () => {
        socket.emit('connection_successful');
        setSession((s) => ({ ...s!, error: false }));
      });

      socket.on('connect_error', (_) => {
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

      socket.on('init_conversation', (message: IMessage) => {
        setFirstUserMessage(message);
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
        setChatSettingsInputs(inputs);
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

      socket.on(
        'update_element',
        (update: { id: string; forIds: string[] }) => {
          setElements((old) => {
            const index = old.findIndex((e) => e.id === update.id);
            if (index === -1) return old;
            const element = old[index];
            const newElement = { ...element, forIds: update.forIds };
            return [
              ...old.slice(0, index),
              newElement,
              ...old.slice(index + 1)
            ];
          });
        }
      );

      socket.on('remove_element', (remove: { id: string }) => {
        setElements((old) => {
          return old.filter((e) => e.id !== remove.id);
        });
        setTasklists((old) => {
          return old.filter((e) => e.id !== remove.id);
        });
        setAvatars((old) => {
          return old.filter((e) => e.id !== remove.id);
        });
      });

      socket.on('action', (action: IAction) => {
        setActions((old) => [...old, action]);
      });

      socket.on('remove_action', (action: IAction) => {
        setActions((old) => {
          const index = old.findIndex((a) => a.id === action.id);
          if (index === -1) return old;
          return [...old.slice(0, index), ...old.slice(index + 1)];
        });
      });

      socket.on('token_usage', (count: number) => {
        setTokenCount((old) => old + count);
      });
    },
    [setSession, sessionId]
  );

  const connect = useCallback(debounce(_connect, 1000), [_connect]);

  const disconnect = useCallback(() => {
    if (session?.socket) {
      session.socket.removeAllListeners();
      session.socket.close();
    }
  }, [session]);

  const clear = useCallback(() => {
    session?.socket.emit('clear_session');
    session?.socket.disconnect();
    resetSessionId();
    setFirstUserMessage(undefined);
    setMessages([]);
    setElements([]);
    setAvatars([]);
    setTasklists([]);
    setActions([]);
    setTokenCount(0);
    resetChatSettings();
    resetChatSettingsValue();
  }, [session]);

  const sendMessage = useCallback(
    (message: IMessage, files?: IFileElement[]) => {
      setMessages((oldMessages) => [...oldMessages, message]);
      session?.socket.emit('ui_message', { message, files });
    },
    [session]
  );

  const replyMessage = useCallback(
    (message: IMessage) => {
      if (askUser) {
        setMessages((oldMessages) => [...oldMessages, message]);
        askUser.callback(message);
      }
    },
    [askUser, session]
  );

  const updateChatSettings = useCallback(
    (values: object) => {
      session?.socket.emit('chat_settings_change', values);
    },
    [session]
  );

  const stopTask = useCallback(() => {
    setLoading(false);
    session?.socket.emit('stop');
  }, [session]);

  const callAction = useCallback(
    (action: IAction) => {
      session?.socket.emit('action_call', action);
    },
    [session]
  );

  const messages = nestMessages(rawMessages);
  const connected = session?.socket.connected && !session?.error;
  const disabled =
    !connected ||
    loading ||
    askUser?.spec.type === 'file' ||
    askUser?.spec.type === 'action';

  return {
    connect,
    clear,
    disconnect,
    sendMessage,
    updateChatSettings,
    stopTask,
    callAction,
    replyMessage,
    connected,
    disabled,
    error: session?.error,
    loading,
    messages,
    actions,
    elements,
    tasklists,
    avatars,
    chatSettingsInputs,
    chatSettingsValue,
    chatSettingsDefaultValue,
    askUser,
    firstUserMessage
  };
};

export { useChat };
