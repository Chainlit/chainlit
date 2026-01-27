import { act, fireEvent, render, screen } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  IStep,
  favoriteMessagesState,
  useConfig
} from '@chainlit/react-client';

import { FavoriteButton } from '@/components/chat/MessageComposer/FavoriteButton';

vi.mock('@/components/i18n/Translator', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const trans: Record<string, string> = {
        'chat.favorites.use': 'Use favorite',
        'chat.favorites.headline': 'Favorites List',
        'chat.favorites.empty.title': 'No Saved Prompts Yet',
        'chat.favorites.empty.description': 'Start by sending a prompt and star it or star a prompt from previous chats'
      };
      return trans[key] || key;
    }
  })
}));

vi.mock('@chainlit/react-client', async () => {
  const { atom } = await import('recoil');
  return {
    useConfig: vi.fn(),
    favoriteMessagesState: atom({
      key: 'favoriteMessagesState',
      default: []
    })
  };
});

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('FavoriteButton', () => {
  const mockOnSelect = vi.fn();

  const mockFavorites: IStep[] = [
    {
      id: 'msg_1',
      output: 'How do I center a div?',
      createdAt: new Date('2023-10-01').getTime(),
      type: 'assistant_message',
      name: 'Assistant'
    },
    {
      id: 'msg_2',
      output: 'Explain Quantum Physics',
      createdAt: new Date('2023-10-05').getTime(),
      type: 'assistant_message',
      name: 'Assistant'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderComponent = (favorites = mockFavorites, props = {}) => {
    return render(
      <RecoilRoot
        initializeState={({ set }) => {
          set(favoriteMessagesState, favorites);
        }}
      >
        <FavoriteButton onSelect={mockOnSelect} {...props} />
      </RecoilRoot>
    );
  };

  it('returns null if the "favorites" feature is disabled in config', () => {
    (useConfig as any).mockReturnValue({
      config: { features: { favorites: false } }
    });

    const { container } = renderComponent();
    expect(container.firstChild).toBeNull();
  });

  it('renders the button with empty state when there are no favorites', () => {
    (useConfig as any).mockReturnValue({
      config: { features: { favorites: true } }
    });

    renderComponent([]);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();

    // Click to open popover
    fireEvent.click(button);

    // Verify empty state message appears
    expect(screen.getByText('No Saved Prompts Yet')).toBeInTheDocument();
    expect(screen.getByText('Start by sending a prompt and star it or star a prompt from previous chats')).toBeInTheDocument();
  });

  it('shows empty state message when popover is opened with no favorites', () => {
    (useConfig as any).mockReturnValue({
      config: { features: { favorites: true } }
    });

    renderComponent([]);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Empty state should be visible
    const emptyTitle = screen.getByText('No Saved Prompts Yet');
    const emptyDescription = screen.getByText('Start by sending a prompt and star it or star a prompt from previous chats');

    expect(emptyTitle).toBeInTheDocument();
    expect(emptyDescription).toBeInTheDocument();

    // Regular favorites list heading should not be visible
    expect(screen.queryByText('Favorites List')).not.toBeInTheDocument();
  });

  it('renders the button when feature is enabled and favorites exist', () => {
    (useConfig as any).mockReturnValue({
      config: { features: { favorites: true } }
    });

    renderComponent();

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('opens the popover and displays the list of favorites when clicked', () => {
    (useConfig as any).mockReturnValue({
      config: { features: { favorites: true } }
    });

    renderComponent();

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Favorites List')).toBeInTheDocument();
    expect(screen.getByText('How do I center a div?')).toBeInTheDocument();
    expect(screen.getByText('Explain Quantum Physics')).toBeInTheDocument();
    expect(
      screen.getByText(new Date('2023-10-01').toLocaleDateString())
    ).toBeInTheDocument();
  });

  it('triggers onSelect with the correct output when an item is clicked', () => {
    (useConfig as any).mockReturnValue({
      config: { features: { favorites: true } }
    });

    renderComponent();

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const item = screen.getByText('How do I center a div?');
    fireEvent.click(item);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith('How do I center a div?');
  });

  it('respects the disabled prop', () => {
    (useConfig as any).mockReturnValue({
      config: { features: { favorites: true } }
    });

    renderComponent(mockFavorites, { disabled: true });

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('shows tooltip text after delay on hover', async () => {
    (useConfig as any).mockReturnValue({
      config: { features: { favorites: true } }
    });

    renderComponent();
    const button = screen.getByRole('button');
    fireEvent.mouseEnter(button);
    expect(screen.queryByText('Use favorite')).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(800);
    });

    const tooltips = screen.getAllByText('Use favorite');
    expect(tooltips.length).toBeGreaterThan(0);
  });

  it('cancels tooltip if mouse leaves before delay', async () => {
    (useConfig as any).mockReturnValue({
      config: { features: { favorites: true } }
    });

    renderComponent();
    const button = screen.getByRole('button');

    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(screen.queryByText('Use favorite')).not.toBeInTheDocument();
  });

  it('hides the tooltip instantly when the popover opens', async () => {
    (useConfig as any).mockReturnValue({
      config: { features: { favorites: true } }
    });

    renderComponent();
    const button = screen.getByRole('button');

    fireEvent.mouseEnter(button);
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(screen.getAllByText('Use favorite').length).toBeGreaterThan(0);

    fireEvent.click(button);
    expect(screen.queryByText('Use favorite')).not.toBeInTheDocument();
    expect(screen.getByText('Favorites List')).toBeInTheDocument();
  });
});
