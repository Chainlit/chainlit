import { atom } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

const COPILOT_THREAD_ID_KEY = 'chainlit-copilot-thread-id';
export const COPILOT_THREAD_CHANGED_EVENT_KEY =
  'chainlit-copilot-thread-changed';
export class CopilotThreadChangedEventParams {
  newThreadId?: string;
}

export const copilotThreadIdState = atom<string>({
  key: 'CopilotThreadId',
  default: '',
  effects: [
    ({ setSelf, onSet }) => {
      const savedValue = localStorage.getItem(COPILOT_THREAD_ID_KEY);

      if (savedValue != null) {
        try {
          const parsedValue = JSON.parse(savedValue);
          setSelf(parsedValue);
        } catch (_error) {
          const newThreadId = uuidv4();
          localStorage.setItem(
            COPILOT_THREAD_ID_KEY,
            JSON.stringify(newThreadId)
          );
          setSelf(newThreadId);
        }
      } else {
        const newThreadId = uuidv4();
        localStorage.setItem(
          COPILOT_THREAD_ID_KEY,
          JSON.stringify(newThreadId)
        );
        setSelf(newThreadId);
      }

      onSet((newValue, _, isReset) => {
        if (isReset) {
          localStorage.removeItem(COPILOT_THREAD_ID_KEY);
        } else {
          localStorage.setItem(COPILOT_THREAD_ID_KEY, JSON.stringify(newValue));
        }
      });
    }
  ]
});

export const getChainlitCopilotThreadId = () => {
  const threadId = localStorage.getItem(COPILOT_THREAD_ID_KEY);
  return threadId ? JSON.parse(threadId) : null;
};

export const clearChainlitCopilotThreadId = (newThreadId?: string) => {
  window.dispatchEvent(
    new CustomEvent<CopilotThreadChangedEventParams>(
      COPILOT_THREAD_CHANGED_EVENT_KEY,
      {
        detail: { newThreadId }
      }
    )
  );
};
