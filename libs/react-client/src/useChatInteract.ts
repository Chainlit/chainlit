import { useCallback } from 'react';
import { useRecoilValue, useResetRecoilState, useSetRecoilState } from 'recoil';
import {
  actionState,
  askUserState,
  avatarState,
  chatSettingsInputsState,
  chatSettingsValueState,
  elementState,
  firstUserMessageState,
  loadingState,
  messagesState,
  sessionIdState,
  sessionState,
  tasklistState,
  threadIdToResumeState,
  tokenCountState
} from 'src/state';
import { IAction, IFileElement, IStep } from 'src/types';
import { addMessage } from 'src/utils/message';

const useChatInteract = () => {
  const session = useRecoilValue(sessionState);
  const askUser = useRecoilValue(askUserState);

  const resetChatSettings = useResetRecoilState(chatSettingsInputsState);
  const resetSessionId = useResetRecoilState(sessionIdState);
  const resetChatSettingsValue = useResetRecoilState(chatSettingsValueState);

  const setFirstUserMessage = useSetRecoilState(firstUserMessageState);
  const setLoading = useSetRecoilState(loadingState);
  const setMessages = useSetRecoilState(messagesState);
  const setElements = useSetRecoilState(elementState);
  const setAvatars = useSetRecoilState(avatarState);
  const setTasklists = useSetRecoilState(tasklistState);
  const setActions = useSetRecoilState(actionState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const setIdToResume = useSetRecoilState(threadIdToResumeState);

  const clear = useCallback(() => {
    session?.socket.emit('clear_session');
    session?.socket.disconnect();
    setIdToResume(undefined);
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
    (message: IStep, files?: IFileElement[]) => {
      setMessages((oldMessages) => addMessage(oldMessages, message));

      session?.socket.emit('ui_message', { message, files });
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

  const stopTask = useCallback(() => {
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

  return {
    callAction,
    clear,
    replyMessage,
    sendMessage,
    stopTask,
    setIdToResume,
    updateChatSettings
  };
};

export { useChatInteract };
