import { useRecoilValue } from 'recoil';
import { IMessage } from 'src/types';
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
  sessionState,
  tasklistState
} from './state';

export interface IMessageUpdate extends IMessage {
  newId?: string;
}

export interface IToken {
  id: number | string;
  token: string;
  isSequence: boolean;
}

const useChatData = () => {
  const firstUserMessage = useRecoilValue(firstUserMessageState);
  const loading = useRecoilValue(loadingState);
  const rawMessages = useRecoilValue(messagesState);
  const elements = useRecoilValue(elementState);
  const avatars = useRecoilValue(avatarState);
  const tasklists = useRecoilValue(tasklistState);
  const actions = useRecoilValue(actionState);
  const session = useRecoilValue(sessionState);
  const askUser = useRecoilValue(askUserState);
  const chatSettingsInputs = useRecoilValue(chatSettingsInputsState);
  const chatSettingsValue = useRecoilValue(chatSettingsValueState);
  const chatSettingsDefaultValue = useRecoilValue(
    chatSettingsDefaultValueSelector
  );

  const messages = nestMessages(rawMessages);
  const connected = session?.socket.connected && !session?.error;
  const disabled =
    !connected ||
    loading ||
    askUser?.spec.type === 'file' ||
    askUser?.spec.type === 'action';

  return {
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

export { useChatData };
