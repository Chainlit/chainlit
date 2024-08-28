import { useCallback, useContext } from 'react';
import { useRecoilValue, useResetRecoilState, useSetRecoilState } from 'recoil';
import {
  accessTokenState,
  actionState,
  askUserState,
  chatSettingsInputsState,
  chatSettingsValueState,
  currentThreadIdState,
  elementState,
  firstUserInteraction,
  loadingState,
  messagesState,
  sessionIdState,
  sessionState,
  sideViewState,
  tasklistState,
  threadIdToResumeState,
  tokenCountState
} from 'src/state';
import { IAction, IFileRef, IStep } from 'src/types';
import { addMessage } from 'src/utils/message';
import { v4 as uuidv4 } from 'uuid';

import { ChainlitContext } from './context';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

const useChatInteract = () => {
  const client = useContext(ChainlitContext);
  const accessToken = useRecoilValue(accessTokenState);
  const session = useRecoilValue(sessionState);
  const askUser = useRecoilValue(askUserState);
  const sessionId = useRecoilValue(sessionIdState);

  const resetChatSettings = useResetRecoilState(chatSettingsInputsState);
  const resetSessionId = useResetRecoilState(sessionIdState);
  const resetChatSettingsValue = useResetRecoilState(chatSettingsValueState);

  const setFirstUserInteraction = useSetRecoilState(firstUserInteraction);
  const setLoading = useSetRecoilState(loadingState);
  const setMessages = useSetRecoilState(messagesState);
  const setElements = useSetRecoilState(elementState);
  const setTasklists = useSetRecoilState(tasklistState);
  const setActions = useSetRecoilState(actionState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const setIdToResume = useSetRecoilState(threadIdToResumeState);
  const setSideView = useSetRecoilState(sideViewState);
  const setCurrentThreadId = useSetRecoilState(currentThreadIdState);

  const clear = useCallback(() => {
    session?.socket.emit('clear_session');
    session?.socket.disconnect();
    setIdToResume(undefined);
    resetSessionId();
    setFirstUserInteraction(undefined);
    setMessages([]);
    setElements([]);
    setTasklists([]);
    setActions([]);
    setTokenCount(0);
    resetChatSettings();
    resetChatSettingsValue();
    setSideView(undefined);
    setCurrentThreadId(undefined);
  }, [session]);

  const sendMessage = useCallback(
    (
      message: PartialBy<IStep, 'createdAt' | 'id'>,
      fileReferences: IFileRef[] = []
    ) => {
      if (!message.id) {
        message.id = uuidv4();
      }
      if (!message.createdAt) {
        message.createdAt = new Date().toISOString();
      }
      setMessages((oldMessages) => addMessage(oldMessages, message as IStep));

      session?.socket.emit('client_message', { message, fileReferences });
    },
    [session?.socket]
  );

  const editMessage = useCallback(
    (message: IStep) => {
      session?.socket.emit('edit_message', { message });
    },
    [session?.socket]
  );

  const sendAudioChunk = useCallback(
    (isStart: boolean, mimeType: string, elapsedTime: number, data: Blob) => {
      session?.socket.emit('audio_chunk', {
        isStart,
        mimeType,
        elapsedTime,
        data
      });
    },
    [session?.socket]
  );

  const endAudioStream = useCallback(
    (fileReferences?: IFileRef[]) => {
      session?.socket.emit('audio_end', { fileReferences });
    },
    [session?.socket]
  );

  const replyMessage = useCallback(
    (message: IStep) => {
      if (askUser) {
        setMessages((oldMessages) => addMessage(oldMessages, message));
        askUser.callback(message);
      }
    },
    [askUser]
  );

  const updateChatSettings = useCallback(
    (values: object) => {
      session?.socket.emit('chat_settings_change', values);
    },
    [session?.socket]
  );

  // create a new assistant
  const createAssistant = useCallback(
    (values: object) => {
      session?.socket.emit('on_create_assistant', values);
    },
    [session?.socket]
  );

  // get the list of assistants from the server and return a list of assistants
  const listAssistants = useCallback(() => {
    return new Promise((resolve, reject) => {
      session?.socket.emit('on_list_assistants', (response) => {
        if (response) {
          resolve(response);
        } else {
          reject(new Error('Failed to fetch assistants'));
        }
      });
    });
  }, [session?.socket]);

  // set the selected assistant (emit a message to the server with the assistant name)
  const setSelectedAssistant = useCallback(
    (assistant: any) => {
      session?.socket.emit('select_assistant', assistant);
    },
    [session?.socket]
  );

  const stopTask = useCallback(() => {
    setMessages((oldMessages) =>
      oldMessages.map((m) => {
        m.streaming = false;
        return m;
      })
    );

    setLoading(false);

    session?.socket.emit('stop');
  }, [session?.socket]);

  const callAction = useCallback(
    (action: IAction) => {
      const socket = session?.socket;
      if (!socket) return;

      const promise = new Promise<{
        id: string;
        status: boolean;
        response?: string;
      }>((resolve, reject) => {
        socket.once('action_response', (response) => {
          if (response.status) {
            resolve(response);
          } else {
            reject(response);
          }
        });
      });

      socket.emit('action_call', action);

      return promise;
    },
    [session?.socket]
  );

  const uploadFile = useCallback(
    (file: File, onProgress: (progress: number) => void, endpoint?: string) => {
      return client.uploadFile(
        file,
        onProgress,
        endpoint,
        sessionId,
        accessToken
      );
    },
    [sessionId, accessToken]
  );

  const uploadAssistantIcon = useCallback(
    (file: File, onProgress: (progress: number) => void) => {
      return client.uploadAssistantIcon(file, onProgress, accessToken);
    },
    [accessToken]
  );

  return {
    uploadFile,
    callAction,
    clear,
    replyMessage,
    sendMessage,
    editMessage,
    sendAudioChunk,
    endAudioStream,
    stopTask,
    setIdToResume,
    updateChatSettings,
    createAssistant,
    listAssistants,
    setSelectedAssistant,
    uploadAssistantIcon
  };
};

export { useChatInteract };
