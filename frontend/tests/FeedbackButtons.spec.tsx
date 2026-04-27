import { MessageContext } from '@/contexts/MessageContext';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IStep } from '@chainlit/react-client';

import { FeedbackButtons } from '@/components/chat/Messages/Message/Buttons/FeedbackButtons';

import { IMessageContext } from '@/types/messageContext';

vi.mock('recoil', async () => {
  const actual = await vi.importActual<typeof import('recoil')>('recoil');
  return {
    ...actual,
    useRecoilValue: () => undefined
  };
});

vi.mock('@chainlit/react-client', () => ({
  useChatSession: () => ({ idToResume: undefined }),
  firstUserInteraction: { __mock: 'firstUserInteraction' }
}));

vi.mock('@/components/i18n/Translator', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key: string) => key }),
  default: ({ path }: { path: string }) => <span>{path}</span>
}));

const baseContext: IMessageContext = {
  cot: 'hidden',
  editable: false,
  loading: false,
  showFeedbackButtons: true,
  uiName: '',
  onError: () => undefined
};

const message: IStep = {
  id: 'step_1',
  type: 'assistant_message',
  name: 'Assistant',
  output: 'hello',
  createdAt: Date.now(),
  streaming: false
};

describe('FeedbackButtons', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('does not violate the Rules of Hooks when showFeedbackButtons flips between renders', () => {
    // Reproduces the React invariant 300/310 caused by hooks placed below
    // the `if (!showFeedbackButtons) return null` guard. `showFeedbackButtons`
    // is derived from `!!config?.dataPersistence`, so when `useConfig` clears
    // `config` to undefined during a chat-profile switch, the guard flips.
    // Hooks below the guard are then skipped and React detects a hook-count
    // mismatch on the next render.
    const tree = (ctx: IMessageContext) => (
      <MessageContext.Provider value={ctx}>
        <FeedbackButtons message={message} />
      </MessageContext.Provider>
    );

    // Render 1: showFeedbackButtons=true -> buttons render, all hooks invoked.
    const { rerender } = render(tree(baseContext));

    // Render 2: showFeedbackButtons=false (mirrors config-clear flipping
    // dataPersistence to undefined). Early-return path activates.
    rerender(tree({ ...baseContext, showFeedbackButtons: false }));

    // Render 3: showFeedbackButtons=true again -> buttons render again.
    rerender(tree(baseContext));

    const hooksOrderError = consoleErrorSpy.mock.calls
      .map((call) => String(call[0]))
      .find(
        (msg) =>
          /Rendered (fewer|more) hooks than during the previous render/.test(
            msg
          ) || /change in the order of Hooks/.test(msg)
      );

    expect(hooksOrderError).toBeUndefined();
  });
});
