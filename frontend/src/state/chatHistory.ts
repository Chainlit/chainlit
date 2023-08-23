import { atom } from 'recoil';

const KEY = 'chat_history';

export type MessageHistory = { content: string; createdAt: number };

const localStorageEffect =
  (key: string) =>
  ({ setSelf, onSet }: { setSelf: any; onSet: any }) => {
    const savedValue = localStorage.getItem(key);
    if (savedValue != null) {
      setSelf(JSON.parse(savedValue));
    }

    onSet((newValue: MessageHistory, _: any, isReset: boolean) => {
      if (isReset) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newValue));
      }
    });
  };

export const chatHistoryState = atom<{
  open: boolean;
  messages: MessageHistory[];
}>({
  key: 'ChatHistory',
  default: {
    open: false,
    messages: []
  },
  effects: [localStorageEffect(KEY)]
});
