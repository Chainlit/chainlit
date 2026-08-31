import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { RecoilRoot, useSetRecoilState } from 'recoil';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FileSpec, IStep } from '@chainlit/react-client';
import { sessionIdState } from '@chainlit/react-client';

import ChatFooter from '@/components/chat/Footer';
import WelcomeScreen from '@/components/chat/WelcomeScreen';

let messages: IStep[] = [];
const { queryParams } = vi.hoisted(() => ({
  queryParams: new URLSearchParams()
}));

vi.mock('@chainlit/react-client', async () => {
  const { atom } = await import('recoil');
  const { createContext } = await import('react');

  return {
    ChainlitContext: createContext({ buildEndpoint: (path: string) => path }),
    commandsState: atom({ key: 'messageComposerCommands', default: [] }),
    modesState: atom({ key: 'messageComposerModes', default: [] }),
    sessionIdState: atom({ key: 'messageComposerSessionId', default: 'a' }),
    useAuth: () => ({ user: undefined }),
    useChatData: () => ({
      askUser: undefined,
      chatSettingsInputs: [],
      disabled: false
    }),
    useChatInteract: () => ({ sendMessage: vi.fn(), replyMessage: vi.fn() }),
    useChatMessages: () => ({ messages }),
    useChatSession: () => ({ chatProfile: undefined }),
    useConfig: () => ({ config: {} })
  };
});

vi.mock('@/components/Logo', () => ({ Logo: () => null }));
vi.mock('@/components/Markdown', () => ({
  Markdown: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));
vi.mock('@/components/WaterMark', () => ({ default: () => null }));
vi.mock('@/components/chat/Starters', () => ({ default: () => null }));
vi.mock('@/components/chat/MessageComposer/Attachments', () => ({
  Attachments: () => null
}));
vi.mock('@/components/chat/MessageComposer/CommandButtons', () => ({
  default: () => null
}));
vi.mock('@/components/chat/MessageComposer/CommandPopoverButton', () => ({
  default: () => null
}));
vi.mock('@/components/chat/MessageComposer/FavoriteButton', () => ({
  default: () => null
}));
vi.mock('@/components/chat/MessageComposer/Mcp', () => ({
  default: () => null
}));
vi.mock('@/components/chat/MessageComposer/ModePicker', () => ({
  default: () => null
}));
vi.mock('@/components/chat/MessageComposer/SubmitButton', () => ({
  default: ({ disabled }: { disabled?: boolean }) => (
    <button id="chat-submit" disabled={disabled} />
  )
}));
vi.mock('@/components/chat/MessageComposer/UploadButton', () => ({
  default: () => null
}));
vi.mock('@/components/chat/MessageComposer/VoiceButton', () => ({
  default: () => null
}));
vi.mock('@/hooks/query', () => ({ useQuery: () => queryParams }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('components/i18n/Translator', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

const composerProps = {
  fileSpec: {} as FileSpec,
  onFileUpload: vi.fn(),
  onFileUploadError: vi.fn(),
  autoScrollRef: { current: true }
};

function SessionScope({ sessionId }: { sessionId: string }) {
  const setSessionId = useSetRecoilState(sessionIdState);

  useEffect(() => {
    setSessionId(sessionId);
  }, [sessionId, setSessionId]);

  return null;
}

function ComposerOwners({ sessionId = 'a' }: { sessionId?: string }) {
  return (
    <RecoilRoot>
      <SessionScope sessionId={sessionId} />
      <WelcomeScreen {...composerProps} />
      <ChatFooter {...composerProps} />
    </RecoilRoot>
  );
}

describe('MessageComposer', () => {
  beforeEach(() => {
    messages = [];
    queryParams.delete('prompt');
  });

  it('preserves a draft when ownership moves from the welcome screen to the footer', () => {
    const view = render(<ComposerOwners />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'draft message' }
    });

    messages = [
      {
        id: 'message-1',
        name: 'Assistant',
        type: 'assistant_message',
        output: 'Hello',
        createdAt: 0
      }
    ];
    view.rerender(<ComposerOwners />);

    expect(screen.getByRole('textbox')).toHaveValue('draft message');
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('discards a draft when the session changes', async () => {
    const view = render(<ComposerOwners />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'draft message' }
    });
    view.rerender(<ComposerOwners sessionId="b" />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    view.rerender(<ComposerOwners sessionId="a" />);
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('');
    });
  });

  it('does not replace an edited draft with the URL prompt after an owner change', async () => {
    queryParams.set('prompt', 'initial prompt');
    const view = render(<ComposerOwners />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('initial prompt');
    });
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'edited draft' }
    });

    messages = [
      {
        id: 'message-1',
        name: 'Assistant',
        type: 'assistant_message',
        output: 'Hello',
        createdAt: 0
      }
    ];
    view.rerender(<ComposerOwners />);

    expect(screen.getByRole('textbox')).toHaveValue('edited draft');
  });

  it('does not restore a URL prompt that the user deleted', async () => {
    queryParams.set('prompt', 'initial prompt');
    const view = render(<ComposerOwners />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('initial prompt');
    });
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '' }
    });

    messages = [
      {
        id: 'message-1',
        name: 'Assistant',
        type: 'assistant_message',
        output: 'Hello',
        createdAt: 0
      }
    ];
    view.rerender(<ComposerOwners />);

    expect(screen.getByRole('textbox')).toHaveValue('');
  });
});
