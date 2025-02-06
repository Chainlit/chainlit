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
  const loading = useChatStore((s) => s.loading);
  const elements = useMessagesStore((s) => s.elements);
  const tasklists = useMessagesStore((s) => s.taskList);
  const actions = useMessagesStore((s) => s.actions);
  const session = useSessionState((s) => s.session);
  const askUser = useUserState((s) => s.askUser);
  const callFn = useChatStore((s) => s.callFn);
  const chatSettingsInputs = useChatStore((s) => s.chatSettingsInputs);
  const chatSettingsValue = useChatStore((s) => s.chatSettingsValue);
  const chatSettingsDefaultValue = useChatStore(
    (s) => s.chatSettingsDefaultValue
  );

  const connected = session?.socket.connected && !session?.error;
  const disabled =
    !connected ||
    loading ||
    askUser?.spec.type === 'file' ||
    askUser?.spec.type === 'action';

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
