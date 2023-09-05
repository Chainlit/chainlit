import { fireEvent, render } from '@testing-library/react';
import { ComponentProps } from 'react';
import { RecoilRoot } from 'recoil';
import { describe, expect, it } from 'vitest';

import { defaultSettingsState, settingsState } from 'state/settings';

import Message from './message';

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
    const { getByText } = render(
      <RecoilRoot>
        <Message {...defaultProps} />
      </RecoilRoot>
    );
    const messageContent = getByText('Hello');

    expect(messageContent).toBeInTheDocument();
  });

  it('toggles the detail button', () => {
    const { getByRole } = render(
      <RecoilRoot>
        <Message {...defaultProps} />
      </RecoilRoot>
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
    const { getByRole } = render(
      <RecoilRoot>
        <Message
          {...defaultProps}
          message={{
            ...defaultProps.message,
            content: 'hello '.repeat(650),
            streaming: true
          }}
        />
      </RecoilRoot>
    );

    expect(getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
  });

  it('preserves the content size when app settings defaultCollapseContent is false', () => {
    const { getByRole } = render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(settingsState, {
            ...defaultSettingsState,
            defaultCollapseContent: false
          });
        }}
      >
        <Message
          {...defaultProps}
          message={{
            ...defaultProps.message,
            content: 'hello '.repeat(650)
          }}
        />
      </RecoilRoot>
    );

    expect(getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
  });
});
