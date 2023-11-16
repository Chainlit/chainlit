import { useCallback } from 'react';
import { useRecoilValue, useResetRecoilState, useSetRecoilState } from 'recoil';
import {
  actionState,
  askUserState,
  avatarState,
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
import { IAction, IFileElement, IMessage } from 'src/types';
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
  const setIdToResume = useSetRecoilState(conversationIdToResumeState);

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
    (message: IMessage, files?: IFileElement[]) => {
      setMessages((oldMessages) => addMessage(oldMessages, message));

      session?.socket.emit('ui_message', { message, files });
    },
    [session]
  );

  const replyMessage = useCallback(
    (message: IMessage) => {
      if (askUser) {
        setMessages((oldMessages) => addMessage(oldMessages, message));
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
