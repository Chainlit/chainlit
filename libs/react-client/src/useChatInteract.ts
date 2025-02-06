import { useCallback, useContext } from 'react';
import { IFileRef, IStep } from 'src/types';
import { addMessage } from 'src/utils/message';
import { v4 as uuidv4 } from 'uuid';

import { ChainlitContext } from './context';
import { useChatStore } from './store/chat';
import { useMessagesStore } from './store/messages';
import { useSessionState } from './store/session';
import { useThreadStore } from './store/thread';
import { useUserState } from './store/user';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

const useChatInteract = () => {
  const client = useContext(ChainlitContext);
  const session = useSessionState((state) => state.session);
  const askUser = useUserState((s) => s.askUser);
  const sessionId = useSessionState((s) => s.sessionId);

  const resetChatSettings = useChatStore((s) => s.resetChatSettingsInputs);
  const resetSessionId = useSessionState((s) => s.resetSessionId);
  const resetChatSettingsValue = useChatStore((s) => s.resetChatSettingsValue);

  const setFirstUserInteraction = useUserState(
    (state) => state.setFirstUserInteraction
  );
  const setLoading = useChatStore((s) => s.setLoading);
  const setMessages = useMessagesStore((s) => s.setMessages);
  const setElements = useMessagesStore((s) => s.setElements);
  const setTasklists = useMessagesStore((s) => s.setTaskList);
  const setActions = useMessagesStore((s) => s.setActions);
  const setTokenCount = useMessagesStore((s) => s.setTokenCount);
  const setIdToResume = useThreadStore((s) => s.setIdToResume);
  const setSideView = useChatStore((s) => s.setSideView);
  const setCurrentThreadId = useThreadStore((s) => s.setCurrentThreadId);

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

  const windowMessage = useCallback(
    (data: any) => {
      session?.socket.emit('window_message', data);
    },
    [session?.socket]
  );

  const startAudioStream = useCallback(() => {
    session?.socket.emit('audio_start');
  }, [session?.socket]);

  const sendAudioChunk = useCallback(
    (
      isStart: boolean,
      mimeType: string,
      elapsedTime: number,
      data: Int16Array
    ) => {
      session?.socket.emit('audio_chunk', {
        isStart,
        mimeType,
        elapsedTime,
        data
      });
    },
    [session?.socket]
  );

  const endAudioStream = useCallback(() => {
    session?.socket.emit('audio_end');
  }, [session?.socket]);

  const replyMessage = useCallback(
    (message: IStep) => {
      if (askUser) {
        if (askUser.parentId) message.parentId = askUser.parentId;
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

  const uploadFile = useCallback(
    (file: File, onProgress: (progress: number) => void) => {
      return client.uploadFile(file, onProgress, sessionId);
    },
    [sessionId]
  );

  return {
    uploadFile,
    clear,
    replyMessage,
    sendMessage,
    editMessage,
    windowMessage,
    startAudioStream,
    sendAudioChunk,
    endAudioStream,
    stopTask,
    setIdToResume,
    updateChatSettings
  };
};

export { useChatInteract };
