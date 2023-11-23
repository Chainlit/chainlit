import debounce from 'lodash/debounce';
import { useCallback } from 'react';
import {
  useRecoilState,
  useRecoilValue,
  useResetRecoilState,
  useSetRecoilState
} from 'recoil';
import io from 'socket.io-client';
import {
  actionState,
  askUserState,
  avatarState,
  chatProfileState,
  chatSettingsInputsState,
  chatSettingsValueState,
  conversationIdToResumeState,
  elementState,
  firstUserMessageState,
  loadingState,
  messagesState,
  sessionIdState,
  sessionState,
  tasklistState,
  tokenCountState
} from 'src/state';
import {
  IAction,
  IAvatarElement,
  IConversation,
  IElement,
  IMessage,
  IMessageElement,
  ITasklistElement
} from 'src/types';
import {
  addMessage,
  deleteMessageById,
  updateMessageById,
  updateMessageContentById
} from 'src/utils/message';

import type { IMessageUpdate, IToken } from './useChatData';

const useChatSession = () => {
  const sessionId = useRecoilValue(sessionIdState);

  const [session, setSession] = useRecoilState(sessionState);

  const resetChatSettingsValue = useResetRecoilState(chatSettingsValueState);
  const setFirstUserMessage = useSetRecoilState(firstUserMessageState);
  const setLoading = useSetRecoilState(loadingState);
  const setMessages = useSetRecoilState(messagesState);
  const setAskUser = useSetRecoilState(askUserState);
  const setElements = useSetRecoilState(elementState);
  const setAvatars = useSetRecoilState(avatarState);
  const setTasklists = useSetRecoilState(tasklistState);
  const setActions = useSetRecoilState(actionState);
  const setChatSettingsInputs = useSetRecoilState(chatSettingsInputsState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const [chatProfile, setChatProfile] = useRecoilState(chatProfileState);
  const idToResume = useRecoilValue(conversationIdToResumeState);

  const _connect = useCallback(
    ({
      wsEndpoint,
      userEnv,
      accessToken
    }: {
      wsEndpoint: string;
      userEnv: Record<string, string>;
      accessToken?: string;
    }) => {
      const socket = io(wsEndpoint, {
        path: '/ws/socket.io',
        extraHeaders: {
          Authorization: accessToken || '',
          'X-Chainlit-Session-Id': sessionId,
          'X-Chainlit-Conversation-Id': idToResume || '',
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

      socket.on('resume_conversation', (conversation: IConversation) => {
        let messages: IMessage[] = [];
        for (const message of conversation.messages) {
          messages = addMessage(messages, message);
        }
        if (conversation.metadata?.chat_profile) {
          setChatProfile(conversation.metadata?.chat_profile);
        }
        setMessages(messages);
        setAvatars(
          (conversation.elements as IAvatarElement[]).filter(
            (e) => e.type === 'avatar'
          )
        );
        setTasklists(
          (conversation.elements as ITasklistElement[]).filter(
            (e) => e.type === 'tasklist'
          )
        );
        setElements(
          (conversation.elements as IMessageElement[]).filter(
            (e) => ['avatar', 'tasklist'].indexOf(e.type) === -1
          )
        );
      });

      socket.on('new_message', (message: IMessage) => {
        setMessages((oldMessages) => addMessage(oldMessages, message));
      });

      socket.on('init_conversation', (message: IMessage) => {
        setFirstUserMessage(message);
      });

      socket.on('update_message', (message: IMessageUpdate) => {
        setMessages((oldMessages) =>
          updateMessageById(oldMessages, message.id, message)
        );
      });

      socket.on('delete_message', (message: IMessage) => {
        setMessages((oldMessages) =>
          deleteMessageById(oldMessages, message.id)
        );
      });

      socket.on('stream_start', (message: IMessage) => {
        setMessages((oldMessages) => addMessage(oldMessages, message));
      });

      socket.on('stream_token', ({ id, token, isSequence }: IToken) => {
        setMessages((oldMessages) =>
          updateMessageContentById(oldMessages, id, token, isSequence)
        );
      });

      socket.on('ask', ({ msg, spec }, callback) => {
        setAskUser({ spec, callback });
        setMessages((oldMessages) => addMessage(oldMessages, msg));

        setLoading(false);
      });

      socket.on('ask_timeout', () => {
        setAskUser(undefined);
        setLoading(false);
      });

      socket.on('clear_ask', () => {
        setAskUser(undefined);
      });

      socket.on('chat_settings', (inputs: any) => {
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
    [setSession, sessionId, chatProfile]
  );

  const connect = useCallback(debounce(_connect, 200), [_connect]);

  const disconnect = useCallback(() => {
    if (session?.socket) {
      session.socket.removeAllListeners();
      session.socket.close();
    }
  }, [session]);

  return { connect, disconnect, chatProfile, idToResume, setChatProfile };
};

export { useChatSession };
