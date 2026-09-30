import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MessageTimestamp } from '@/components/chat/Messages/Message/MessageTimestamp';

const { mockUseConfig } = vi.hoisted(() => ({ mockUseConfig: vi.fn() }));

vi.mock('@chainlit/react-client', () => ({
  useConfig: mockUseConfig
}));

describe('MessageTimestamp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is hidden unless message timestamps are enabled', () => {
    mockUseConfig.mockReturnValue({ config: { ui: {} } });

    const { container } = render(
      <MessageTimestamp createdAt="2026-09-30T08:00:00.000Z" />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders the message creation time in the browser locale', () => {
    mockUseConfig.mockReturnValue({
      config: { ui: { show_message_timestamps: true } }
    });
    const createdAt = '2026-09-30T08:00:00.000Z';
    const date = new Date(createdAt);

    const { container } = render(<MessageTimestamp createdAt={createdAt} />);

    const timestamp = container.querySelector('time');
    expect(timestamp).not.toBeNull();
    expect(timestamp).toHaveAttribute('datetime', date.toISOString());
    expect(timestamp).toHaveAttribute('aria-label', date.toLocaleString());
    expect(timestamp).toHaveTextContent(
      date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit'
      })
    );
  });

  it('does not render an invalid timestamp', () => {
    mockUseConfig.mockReturnValue({
      config: { ui: { show_message_timestamps: true } }
    });

    const { container } = render(<MessageTimestamp createdAt="invalid" />);

    expect(container.firstChild).toBeNull();
  });
});
