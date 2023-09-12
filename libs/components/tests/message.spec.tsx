import { fireEvent, render } from '@testing-library/react';
import { MessageContext, defaultMessageContext } from 'contexts/MessageContext';
import { ComponentProps } from 'react';
import { Message } from 'src/messages/Message';
import { describe, expect, it } from 'vitest';

describe('Message', () => {
  const defaultProps: ComponentProps<typeof Message> = {
    message: {
      id: '1',
      content: 'Hello',
      authorIsUser: true,
      subMessages: [
        {
          id: '2',
          content: 'bar',
          author: 'bar',
          createdAt: '12/12/2002'
        }
      ],
      waitForAnswer: false,
      author: 'foo',
      createdAt: '12/12/2002'
    },
    elements: [],
    actions: [],
    indent: 0,
    showAvatar: true,
    showBorder: true,
    isRunning: false,
    isLast: true
  };

  it('renders message content', () => {
    const { getByText } = render(<Message {...defaultProps} />);
    const messageContent = getByText('Hello');

    expect(messageContent).toBeInTheDocument();
  });

  it('toggles the detail button', () => {
    const { getByRole } = render(<Message {...defaultProps} />);
    let detailsButton = getByRole('button', { name: 'Took 1 step' });

    expect(detailsButton).toBeInTheDocument();
    fireEvent.click(detailsButton);
    const closeButton = getByRole('button', { name: 'Took 1 step' });

    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);
    detailsButton = getByRole('button', { name: 'Took 1 step' });

    expect(detailsButton).toBeInTheDocument();
  });

  it('preserves the content size when message is streamed', () => {
    const { getByRole } = render(
      <Message
        {...defaultProps}
        message={{
          ...defaultProps.message,
          content: 'hello '.repeat(650),
          streaming: true
        }}
      />
    );

    expect(getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
  });

  it('preserves the content size when app settings defaultCollapseContent is false', () => {
    const { getByRole } = render(
      <MessageContext.Provider
        value={{ ...defaultMessageContext, defaultCollapseContent: false }}
      >
        <Message
          {...defaultProps}
          message={{
            ...defaultProps.message,
            content: 'hello '.repeat(650)
          }}
        />
      </MessageContext.Provider>
    );

    expect(getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
  });
});
