import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
        'chat.favorites.headline': 'Favorites List'
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

  it('returns null if there are no favorites in the state', () => {
    (useConfig as any).mockReturnValue({
      config: { features: { favorites: true } }
    });

    const { container } = renderComponent([]);
    expect(container.firstChild).toBeNull();
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

  it('shows tooltip text on hover', async () => {
    (useConfig as any).mockReturnValue({
      config: { features: { favorites: true } }
    });

    renderComponent();

    const button = screen.getByRole('button');
    fireEvent.mouseOver(button);
    fireEvent.focus(button);

    await waitFor(() => {
      const tooltips = screen.getAllByText('Use favorite');
      expect(tooltips.length).toBeGreaterThan(0);
      expect(tooltips[0]).toBeInTheDocument();
    });
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
});
