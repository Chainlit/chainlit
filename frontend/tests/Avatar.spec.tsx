import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MessageAvatar } from '@/components/chat/Messages/Message/Avatar';

const mockUseConfig = vi.fn();
const mockUseChatSession = vi.fn();

vi.mock('@chainlit/react-client', () => ({
  ChainlitContext: {
    Provider: ({ children }: any) => children,
    Consumer: ({ children }: any) =>
      children({
        buildEndpoint: (url: string) => `http://localhost:8000${url}`
      })
  },
  useConfig: () => mockUseConfig(),
  useChatSession: () => mockUseChatSession()
}));

// Radix Avatar renders fallback in JSDOM because Image onload does not fire in node
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AvatarImage: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
  AvatarFallback: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  )
}));

describe('MessageAvatar component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConfig.mockReturnValue({
      config: {
        ui: {
          name: 'Assistant'
        },
        chatProfiles: [
          {
            name: 'GPT-3.5',
            icon: 'https://example.com/gpt3.png'
          },
          {
            name: 'GPT-4',
            icon: 'https://example.com/gpt4.png'
          }
        ]
      }
    });
    mockUseChatSession.mockReturnValue({
      chatProfile: 'GPT-3.5'
    });
  });

  it('renders avatar icon using active chatProfile when messageChatProfile is not specified', () => {
    render(<MessageAvatar author="Assistant" />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/gpt3.png');
  });

  it('renders avatar icon using messageChatProfile when specified on historical message', () => {
    mockUseChatSession.mockReturnValue({
      chatProfile: 'GPT-4' // Currently active profile is GPT-4
    });

    // Message was authored under GPT-3.5
    render(<MessageAvatar author="Assistant" messageChatProfile="GPT-3.5" />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/gpt3.png');
  });

  it('renders error icon when isError is true', () => {
    const { container } = render(<MessageAvatar isError={true} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
