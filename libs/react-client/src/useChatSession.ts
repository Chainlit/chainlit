import { debounce } from 'lodash';
import { useCallback, useContext, useEffect } from 'react';
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
  audioConnectionState,
  callFnState,
  chatProfileState,
  chatSettingsInputsState,
  chatSettingsValueState,
  commandsState,
  currentThreadIdState,
  elementState,
  firstUserInteraction,
  isAiSpeakingState,
  loadingState,
  messagesState,
  resumeThreadErrorState,
  sessionIdState,
  sessionState,
  sideViewState,
  tasklistState,
  threadIdToResumeState,
  tokenCountState,
  wavRecorderState,
  wavStreamPlayerState
} from 'src/state';
import {
  IAction,
  ICommand,
  IElement,
  IMessageElement,
  IStep,
  ITasklistElement,
  IThread
} from 'src/types';
import {
  addMessage,
  deleteMessageById,
  updateMessageById,
  updateMessageContentById
} from 'src/utils/message';

import { OutputAudioChunk } from './types/audio';

import { ChainlitContext } from './context';
import type { IToken } from './useChatData';

const useChatSession = () => {
  const client = useContext(ChainlitContext);
  const sessionId = useRecoilValue(sessionIdState);

  const [session, setSession] = useRecoilState(sessionState);
  const setIsAiSpeaking = useSetRecoilState(isAiSpeakingState);
  const setAudioConnection = useSetRecoilState(audioConnectionState);
  const resetChatSettingsValue = useResetRecoilState(chatSettingsValueState);
  const setFirstUserInteraction = useSetRecoilState(firstUserInteraction);
  const setLoading = useSetRecoilState(loadingState);
  const wavStreamPlayer = useRecoilValue(wavStreamPlayerState);
  const wavRecorder = useRecoilValue(wavRecorderState);
  const setMessages = useSetRecoilState(messagesState);
  const setAskUser = useSetRecoilState(askUserState);
  const setCallFn = useSetRecoilState(callFnState);
  const setCommands = useSetRecoilState(commandsState);
  const setSideView = useSetRecoilState(sideViewState);
  const setElements = useSetRecoilState(elementState);
  const setTasklists = useSetRecoilState(tasklistState);
  const setActions = useSetRecoilState(actionState);
  const setChatSettingsInputs = useSetRecoilState(chatSettingsInputsState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const [chatProfile, setChatProfile] = useRecoilState(chatProfileState);
  const idToResume = useRecoilValue(threadIdToResumeState);
  const setThreadResumeError = useSetRecoilState(resumeThreadErrorState);

  const [currentThreadId, setCurrentThreadId] =
    useRecoilState(currentThreadIdState);

  // Use currentThreadId as thread id in websocket header
  useEffect(() => {
    if (session?.socket) {
      session.socket.auth['threadId'] = currentThreadId || '';
    }
  }, [currentThreadId]);

  const _connect = useCallback(
    ({
      transports,
      userEnv
    }: {
      transports?: string[];
      userEnv: Record<string, string>;
    }) => {
      const { protocol, host, pathname } = new URL(client.httpEndpoint);
      const uri = `${protocol}//${host}`;
      const path =
        pathname && pathname !== '/'
          ? `${pathname}/ws/socket.io`
          : '/ws/socket.io';

      const socket = io(uri, {
        path,
        withCredentials: true,
        transports,
        auth: {
          clientType: client.type,
          sessionId,
          threadId: idToResume || '',
          userEnv: JSON.stringify(userEnv),
          chatProfile: chatProfile ? encodeURIComponent(chatProfile) : ''
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

      socket.on('audio_connection', async (state: 'on' | 'off') => {
        if (state === 'on') {
          let isFirstChunk = true;
          const startTime = Date.now();
          const mimeType = 'pcm16';
          // Connect to microphone
          await wavRecorder.begin();
          await wavStreamPlayer.connect();
          await wavRecorder.record(async (data) => {
            const elapsedTime = Date.now() - startTime;
            socket.emit('audio_chunk', {
              isStart: isFirstChunk,
              mimeType,
              elapsedTime,
              data: data.mono
            });
            isFirstChunk = false;
          });
          wavStreamPlayer.onStop = () => setIsAiSpeaking(false);
        } else {
          await wavRecorder.end();
          await wavStreamPlayer.interrupt();
        }
        setAudioConnection(state);
      });

      socket.on('audio_chunk', (chunk: OutputAudioChunk) => {
        wavStreamPlayer.add16BitPCM(chunk.data, chunk.track);
        setIsAiSpeaking(true);
      });

      socket.on('audio_interrupt', () => {
        wavStreamPlayer.interrupt();
      });

      socket.on('resume_thread', (thread: IThread) => {
        let messages: IStep[] = [];
        for (const step of thread.steps) {
          messages = addMessage(messages, step);
        }
        if (thread.metadata?.chat_profile) {
          setChatProfile(thread.metadata?.chat_profile);
        }
        setMessages(messages);
        const elements = thread.elements || [];
        setTasklists(
          (elements as ITasklistElement[]).filter((e) => e.type === 'tasklist')
        );
        setElements(
          (elements as IMessageElement[]).filter(
            (e) => ['avatar', 'tasklist'].indexOf(e.type) === -1
          )
        );
      });

      socket.on('resume_thread_error', (error?: string) => {
        setThreadResumeError(error);
      });

      socket.on('new_message', (message: IStep) => {
        setMessages((oldMessages) => addMessage(oldMessages, message));
      });

      socket.on(
        'first_interaction',
        (event: { interaction: string; thread_id: string }) => {
          setFirstUserInteraction(event.interaction);
          setCurrentThreadId(event.thread_id);
        }
      );

      socket.on('update_message', (message: IStep) => {
        setMessages((oldMessages) =>
          updateMessageById(oldMessages, message.id, message)
        );
      });

      socket.on('delete_message', (message: IStep) => {
        setMessages((oldMessages) =>
          deleteMessageById(oldMessages, message.id)
        );
      });

      socket.on('stream_start', (message: IStep) => {
        setMessages((oldMessages) => addMessage(oldMessages, message));
      });

      socket.on(
        'stream_token',
        ({ id, token, isSequence, isInput }: IToken) => {
          setMessages((oldMessages) =>
            updateMessageContentById(
              oldMessages,
              id,
              token,
              isSequence,
              isInput
            )
          );
        }
      );

      socket.on('ask', ({ msg, spec }, callback) => {
        setAskUser({ spec, callback, parentId: msg.parentId });
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

      socket.on('call_fn', ({ name, args }, callback) => {
        setCallFn({ name, args, callback });
      });

      socket.on('clear_call_fn', () => {
        setCallFn(undefined);
      });

      socket.on('call_fn_timeout', () => {
        setCallFn(undefined);
      });

      socket.on('chat_settings', (inputs: any) => {
        setChatSettingsInputs(inputs);
        resetChatSettingsValue();
      });

      socket.on('set_commands', (commands: ICommand[]) => {
        setCommands(commands);
      });

      socket.on('set_sidebar_title', (title: string) => {
        setSideView((prev) => {
          return { title, elements: prev?.elements || [] };
        });
      });

      socket.on('set_sidebar_elements', (elements: IMessageElement[]) => {
        if (!elements.length) {
          setSideView(undefined);
        } else {
          elements.forEach((element) => {
            if (!element.url && element.chainlitKey) {
              element.url = client.getElementUrl(
                element.chainlitKey,
                sessionId
              );
            }
          });
          setSideView((prev) => {
            return { title: prev?.title || '', elements: elements };
          });
        }
      });

      socket.on('element', (element: IElement) => {
        if (!element.url && element.chainlitKey) {
          element.url = client.getElementUrl(element.chainlitKey, sessionId);
        }

        if (element.type === 'tasklist') {
          setTasklists((old) => {
            const index = old.findIndex((e) => e.id === element.id);
            if (index === -1) {
              return [...old, element];
            } else {
              return [...old.slice(0, index), element, ...old.slice(index + 1)];
            }
          });
        } else {
          setElements((old) => {
            const index = old.findIndex((e) => e.id === element.id);
            if (index === -1) {
              return [...old, element];
            } else {
              return [...old.slice(0, index), element, ...old.slice(index + 1)];
            }
          });
        }
      });

      socket.on('remove_element', (remove: { id: string }) => {
        setElements((old) => {
          return old.filter((e) => e.id !== remove.id);
        });
        setTasklists((old) => {
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

      socket.on('window_message', (data: any) => {
        if (window.parent) {
          window.parent.postMessage(data, '*');
        }
      });
    },
    [setSession, sessionId, idToResume, chatProfile]
  );

  const connect = useCallback(debounce(_connect, 200), [_connect]);

  const disconnect = useCallback(() => {
    if (session?.socket) {
      session.socket.removeAllListeners();
      session.socket.close();
    }
  }, [session]);

  return {
    connect,
    disconnect,
    session,
    sessionId,
    chatProfile,
    idToResume,
    setChatProfile
  };
};

export { useChatSession };
