import { fireEvent, render } from '@testing-library/react';
import { MessageContext, defaultMessageContext } from 'contexts/MessageContext';
import { ComponentProps } from 'react';
import { Message } from 'src/messages/Message';
import { describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

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
    const theme = createTheme({});
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <Message {...defaultProps} />
      </ThemeProvider>
    );
    const messageContent = getByText('Hello');

    expect(messageContent).toBeInTheDocument();
  });

  it('toggles the detail button', () => {
    const theme = createTheme({});
    const { getByRole } = render(
      <ThemeProvider theme={theme}>
        <Message {...defaultProps} />
      </ThemeProvider>
    );
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
    const theme = createTheme({});
    const { getByRole } = render(
      <ThemeProvider theme={theme}>
        <Message
          {...defaultProps}
          message={{
            ...defaultProps.message,
            content: 'hello '.repeat(650),
            streaming: true
          }}
        />
      </ThemeProvider>
    );

    expect(getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
  });

  it('preserves the content size when app settings defaultCollapseContent is false', () => {
    const theme = createTheme({});
    const { getByRole } = render(
      <ThemeProvider theme={theme}>
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
      </ThemeProvider>
    );

    expect(getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
  });
});
