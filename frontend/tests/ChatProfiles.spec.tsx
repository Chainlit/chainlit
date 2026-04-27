import { render } from '@testing-library/react';
import { createContext } from 'react';
import { RecoilRoot } from 'recoil';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ChatProfiles from '@/components/header/ChatProfiles';

let mockConfig: any = undefined;
const setChatProfileMock = vi.fn();
const clearMock = vi.fn();

vi.mock('@chainlit/react-client', () => ({
  useConfig: () => ({ config: mockConfig }),
  useChatSession: () => ({
    chatProfile: undefined,
    setChatProfile: setChatProfileMock
  }),
  useChatMessages: () => ({ firstInteraction: undefined }),
  useChatInteract: () => ({ clear: clearMock }),
  ChainlitContext: createContext({ buildEndpoint: (p: string) => p })
}));

vi.mock('@/components/Markdown', () => ({
  Markdown: ({ children }: any) => <div>{children}</div>
}));

vi.mock('@/components/header/NewChat', () => ({
  NewChatDialog: () => null
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <RecoilRoot>{children}</RecoilRoot>
);

describe('ChatProfiles', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockConfig = undefined;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('does not violate the Rules of Hooks when config is cleared between renders', () => {
    // Reproduces the React invariant 300/310 caused by hooks placed below
    // the early `return null`. `useConfig` clears `config` to undefined when
    // the chat profile changes, so `config?.chatProfiles?.length` flips
    // between truthy and falsy across consecutive renders. If any hooks live
    // below the guard, the hook count differs between renders and React
    // throws "Rendered fewer/more hooks than during the previous render".
    const twoProfiles = {
      chatProfiles: [
        { name: 'GPT-3.5', markdown_description: 'a', icon: '' },
        { name: 'GPT-4', markdown_description: 'b', icon: '' }
      ],
      features: {}
    };

    // Render 1: config populated -> dropdown renders.
    mockConfig = twoProfiles;
    const { rerender } = render(<ChatProfiles />, { wrapper });

    // Render 2: config cleared (mirrors useConfig's setConfig(undefined)
    // when chatProfile changes). The early-return path now activates.
    mockConfig = undefined;
    rerender(<ChatProfiles />);

    // Render 3: config returns -> dropdown renders again.
    mockConfig = twoProfiles;
    rerender(<ChatProfiles />);

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
