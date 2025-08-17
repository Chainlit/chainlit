import { useChatStore } from './store/chat';
import { useMessagesStore } from './store/messages';
import { useSessionState } from './store/session';
import { useUserState } from './store/user';

export interface IToken {
  id: number | string;
  token: string;
  isSequence: boolean;
  isInput: boolean;
}

const useChatData = () => {
  const loading = useChatStore((state) => state.loading);
  const elements = useMessagesStore((state) => state.elements);
  const tasklists = useMessagesStore((state) => state.taskList);
  const actions = useMessagesStore((state) => state.actions);
  const session = useSessionState((state) => state.session);
  const askUser = useUserState((state) => state.askUser);
  const callFn = useChatStore((state) => state.callFn);
  const chatSettingsInputs = useChatStore((state) => state.chatSettingsInputs);
  const chatSettingsValue = useChatStore((state) => state.chatSettingsValue);
  const chatSettingsDefaultValue = useChatStore(
    (state) => state.chatSettingsDefaultValue
  );

  const connected = session?.socket.connected && !session?.error;
  const disabled =
    !connected ||
    loading ||
    askUser?.spec.type === 'file' ||
    askUser?.spec.type === 'action' ||
    askUser?.spec.type === 'element';

  return {
    actions,
    askUser,
    callFn,
    chatSettingsDefaultValue,
    chatSettingsInputs,
    chatSettingsValue,
    connected,
    disabled,
    elements,
    error: session?.error,
    loading,
    tasklists
  };
};

export { useChatData };
