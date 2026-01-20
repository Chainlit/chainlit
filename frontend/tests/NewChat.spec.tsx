import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NewChatButton from '@/components/header/NewChat';

const mockClear = vi.fn();
const mockUseConfig = vi.fn();

vi.mock('@chainlit/react-client', () => ({
  useChatInteract: () => ({ clear: mockClear }),
  useConfig: () => mockUseConfig()
}));

vi.mock('@/components/i18n', () => ({
  Translator: ({ path }: { path: string }) => <span>{path}</span>
}));

describe('NewChatButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConfig.mockReturnValue({ config: {} });
  });

  it('renders the button correctly', () => {
    render(<NewChatButton />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('opens dialog by default when config is undefined', () => {
    mockUseConfig.mockReturnValue({ config: undefined });

    render(<NewChatButton />);
    fireEvent.click(screen.getByRole('button'));

    expect(
      screen.getByText('navigation.newChat.dialog.title')
    ).toBeInTheDocument();
  });

  it('opens dialog by default when ui config is missing', () => {
    mockUseConfig.mockReturnValue({ config: { project: {} } });

    render(<NewChatButton />);
    fireEvent.click(screen.getByRole('button'));

    expect(
      screen.getByText('navigation.newChat.dialog.title')
    ).toBeInTheDocument();
  });

  it('clears chat and navigates when confirmed via Dialog', () => {
    mockUseConfig.mockReturnValue({ config: {} });
    const mockNavigate = vi.fn();

    render(<NewChatButton navigate={mockNavigate} />);

    fireEvent.click(screen.getByRole('button'));

    const confirmBtn = screen.getByText('common.actions.confirm');
    fireEvent.click(confirmBtn);

    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('skips dialog and activates immediately when confirm_new_chat is false', () => {
    mockUseConfig.mockReturnValue({
      config: { ui: { confirm_new_chat: false } }
    });

    const mockNavigate = vi.fn();
    render(<NewChatButton navigate={mockNavigate} />);

    fireEvent.click(screen.getByRole('button'));

    expect(
      screen.queryByText('navigation.newChat.dialog.title')
    ).not.toBeInTheDocument();
    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('opens dialog explicitly when confirm_new_chat is true', () => {
    mockUseConfig.mockReturnValue({
      config: { ui: { confirm_new_chat: true } }
    });

    render(<NewChatButton />);
    fireEvent.click(screen.getByRole('button'));

    expect(
      screen.getByText('navigation.newChat.dialog.title')
    ).toBeInTheDocument();
    expect(mockClear).not.toHaveBeenCalled();
  });

  it('uses custom onConfirm handler if provided', () => {
    mockUseConfig.mockReturnValue({
      config: { ui: { confirm_new_chat: false } }
    });

    const customOnConfirm = vi.fn();
    render(<NewChatButton onConfirm={customOnConfirm} />);

    fireEvent.click(screen.getByRole('button'));

    expect(customOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockClear).not.toHaveBeenCalled();
  });
});
