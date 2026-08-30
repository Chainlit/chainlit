import { fireEvent, render, screen } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChatProfiles from '@/components/header/ChatProfiles';

const mockClear = vi.fn();
const mockSetChatProfile = vi.fn();
const mockHotSwapChatProfile = vi.fn();
const mockUseConfig = vi.fn();
const mockUseChatMessages = vi.fn();
const mockUseChatSession = vi.fn();

vi.mock('@chainlit/react-client', () => ({
  ChainlitContext: {
    Provider: ({ children }: any) => children,
    Consumer: ({ children }: any) =>
      children({ buildEndpoint: (url: string) => url })
  },
  useChatInteract: () => ({ clear: mockClear }),
  useConfig: () => mockUseConfig(),
  useChatMessages: () => mockUseChatMessages(),
  useChatSession: () => mockUseChatSession()
}));

vi.mock('@/components/i18n', () => ({
  Translator: ({ path }: { path: string }) => <span>{path}</span>
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <div data-testid="select" data-value={value}>
      <button
        data-testid="trigger-select-gpt4"
        onClick={() => onValueChange('GPT-4')}
      >
        Select GPT-4
      </button>
      {children}
    </div>
  ),
  SelectTrigger: ({ children, ...props }: any) => (
    <div role="combobox" {...props}>
      {children}
    </div>
  ),
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value, ...props }: any) => (
    <div data-value={value} {...props}>
      {children}
    </div>
  )
}));

const sampleChatProfiles = [
  {
    name: 'GPT-3.5',
    markdown_description: 'GPT-3.5 description',
    icon: 'https://example.com/gpt3.png'
  },
  {
    name: 'GPT-4',
    markdown_description: 'GPT-4 description',
    icon: 'https://example.com/gpt4.png'
  }
];

describe('ChatProfiles component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConfig.mockReturnValue({
      config: {
        chatProfiles: sampleChatProfiles,
        features: {
          hot_swap_chat_profile: false
        }
      }
    });
    mockUseChatSession.mockReturnValue({
      chatProfile: 'GPT-3.5',
      setChatProfile: mockSetChatProfile,
      hotSwapChatProfile: mockHotSwapChatProfile
    });
    mockUseChatMessages.mockReturnValue({
      firstInteraction: false
    });
  });

  it('returns null when chatProfiles is empty', () => {
    mockUseConfig.mockReturnValue({
      config: {
        chatProfiles: []
      }
    });

    const { container } = render(
      <RecoilRoot>
        <ChatProfiles />
      </RecoilRoot>
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when chatProfiles has only 1 profile', () => {
    mockUseConfig.mockReturnValue({
      config: {
        chatProfiles: [sampleChatProfiles[0]]
      }
    });

    const { container } = render(
      <RecoilRoot>
        <ChatProfiles />
      </RecoilRoot>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders chat profiles trigger when multiple profiles exist', () => {
    render(
      <RecoilRoot>
        <ChatProfiles />
      </RecoilRoot>
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
  });

  it('sets initial profile if chatProfile is null/empty', () => {
    mockUseChatSession.mockReturnValue({
      chatProfile: '',
      setChatProfile: mockSetChatProfile,
      hotSwapChatProfile: mockHotSwapChatProfile
    });

    render(
      <RecoilRoot>
        <ChatProfiles />
      </RecoilRoot>
    );

    expect(mockSetChatProfile).toHaveBeenCalledWith('GPT-3.5');
  });

  describe('Legacy mode (hot_swap_chat_profile: false)', () => {
    it('switches profile directly without dialog if firstInteraction is false', () => {
      mockUseChatMessages.mockReturnValue({ firstInteraction: false });

      render(
        <RecoilRoot>
          <ChatProfiles />
        </RecoilRoot>
      );

      fireEvent.click(screen.getByTestId('trigger-select-gpt4'));

      expect(mockSetChatProfile).toHaveBeenCalledWith('GPT-4');
      expect(mockClear).toHaveBeenCalled();
      expect(mockHotSwapChatProfile).not.toHaveBeenCalled();
    });

    it('opens confirmation dialog if firstInteraction is true', () => {
      mockUseChatMessages.mockReturnValue({ firstInteraction: true });
      const mockNavigate = vi.fn();

      render(
        <RecoilRoot>
          <ChatProfiles navigate={mockNavigate} />
        </RecoilRoot>
      );

      fireEvent.click(screen.getByTestId('trigger-select-gpt4'));

      // Dialog should open with confirm action
      expect(
        screen.getByText('navigation.newChat.dialog.title')
      ).toBeInTheDocument();
      expect(mockSetChatProfile).not.toHaveBeenCalled();

      // Confirm dialog
      fireEvent.click(screen.getByText('common.actions.confirm'));

      expect(mockSetChatProfile).toHaveBeenCalledWith('GPT-4');
      expect(mockClear).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Hot-swap mode (hot_swap_chat_profile: true)', () => {
    beforeEach(() => {
      mockUseConfig.mockReturnValue({
        config: {
          chatProfiles: sampleChatProfiles,
          features: {
            hot_swap_chat_profile: true
          }
        }
      });
      mockHotSwapChatProfile.mockReturnValue(true);
    });

    it('hot-swaps profile without opening dialog even when firstInteraction is true', () => {
      mockUseChatMessages.mockReturnValue({ firstInteraction: true });

      render(
        <RecoilRoot>
          <ChatProfiles />
        </RecoilRoot>
      );

      fireEvent.click(screen.getByTestId('trigger-select-gpt4'));

      // Dialog should NOT be present
      expect(
        screen.queryByText('navigation.newChat.dialog.title')
      ).not.toBeInTheDocument();
      // hotSwapChatProfile called directly
      expect(mockHotSwapChatProfile).toHaveBeenCalledWith('GPT-4');
      // clear() and setChatProfile() NOT called
      expect(mockClear).not.toHaveBeenCalled();
      expect(mockSetChatProfile).not.toHaveBeenCalled();
    });

    it('falls back to clear and setChatProfile if hotSwapChatProfile returns false', () => {
      mockHotSwapChatProfile.mockReturnValue(false);
      mockUseChatMessages.mockReturnValue({ firstInteraction: true });
      const mockNavigate = vi.fn();

      render(
        <RecoilRoot>
          <ChatProfiles navigate={mockNavigate} />
        </RecoilRoot>
      );

      fireEvent.click(screen.getByTestId('trigger-select-gpt4'));

      expect(mockHotSwapChatProfile).toHaveBeenCalledWith('GPT-4');
      expect(mockSetChatProfile).toHaveBeenCalledWith('GPT-4');
      expect(mockClear).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
