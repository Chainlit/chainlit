import { atom } from 'recoil';

import { UserInput } from '@chainlit/react-client';

const KEY = 'input_history';

const localStorageEffect =
  (key: string) =>
  ({ setSelf, onSet }: { setSelf: any; onSet: any }) => {
    const savedValue = localStorage.getItem(key);
    if (savedValue != null) {
      setSelf(JSON.parse(savedValue));
    }

    onSet((newValue: UserInput, _: any, isReset: boolean) => {
      if (isReset) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newValue));
      }
    });
  };

export const inputHistoryState = atom<{
  open: boolean;
  inputs: UserInput[];
}>({
  key: 'UserInputHistory',
  default: {
    open: false,
    inputs: []
  },
  effects: [localStorageEffect(KEY)]
});
