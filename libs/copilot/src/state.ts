import { atom } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

export const copilotThreadIdState = atom<string>({
  key: 'CopilotThreadId',
  default: '',
  effects: [
    ({ setSelf, onSet }) => {
      const key = 'chainlit-copilot-thread-id';
      const savedValue = localStorage.getItem(key);

      if (savedValue != null) {
        try {
          const parsedValue = JSON.parse(savedValue);
          setSelf(parsedValue);
        } catch (_error) {
          const newThreadId = uuidv4();
          localStorage.setItem(key, JSON.stringify(newThreadId));
          setSelf(newThreadId);
        }
      } else {
        const newThreadId = uuidv4();
        localStorage.setItem(key, JSON.stringify(newThreadId));
        setSelf(newThreadId);
      }

      onSet((newValue, _, isReset) => {
        if (isReset) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(newValue));
        }
      });
    }
  ]
});

export const getChainlitCopilotThreadId = () => {
  const threadId = localStorage.getItem('chainlit-copilot-thread-id');
  return threadId ? JSON.parse(threadId) : null;
};

export const clearChainlitCopilotThreadId = () => {
  localStorage.removeItem('chainlit-copilot-thread-id');
};
