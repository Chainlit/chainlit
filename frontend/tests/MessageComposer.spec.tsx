import { fireEvent, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import { RecoilRoot, useSetRecoilState } from 'recoil';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sessionIdState } from '@chainlit/react-client';

import MessageComposer from '@/components/chat/MessageComposer';

const { queryParams } = vi.hoisted(() => ({
  queryParams: new URLSearchParams()
}));

vi.mock('@chainlit/react-client', async () => {
  const { atom } = await import('recoil');

  return {
    commandsState: atom({ key: 'ComposerTestCommands', default: [] }),
    modesState: atom({ key: 'ComposerTestModes', default: [] }),
    sessionIdState: atom({
      key: 'ComposerTestSessionId',
      default: 'session-1'
    }),
    useAuth: () => ({ user: { identifier: 'tester' } }),
    useChatData: () => ({
      askUser: undefined,
      chatSettingsInputs: [],
      disabled: false
    }),
    useChatInteract: () => ({
      replyMessage: vi.fn(),
      sendMessage: vi.fn()
    }),
    useConfig: () => ({ config: {} })
  };
});

vi.mock('components/i18n/Translator', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

vi.mock('@/hooks/query', () => ({
  useQuery: () => queryParams
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false
}));

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
  default: () => null
}));
vi.mock('@/components/chat/MessageComposer/UploadButton', () => ({
  default: () => null
}));
vi.mock('@/components/chat/MessageComposer/VoiceButton', () => ({
  default: () => null
}));

function ComposerOwnerSwap() {
  const [owner, setOwner] = useState<'welcome' | 'footer'>('welcome');
  const setSessionId = useSetRecoilState(sessionIdState);
  const autoScrollRef = useRef(true);

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setOwner((current) => (current === 'welcome' ? 'footer' : 'welcome'))
        }
      >
        Swap composer owner
      </button>
      <button type="button" onClick={() => setSessionId('session-2')}>
        Start new session
      </button>
      <MessageComposer
        key={owner}
        fileSpec={{ max_size_mb: 1, max_files: 1, accept: {} }}
        onFileUpload={vi.fn()}
        onFileUploadError={vi.fn()}
        autoScrollRef={autoScrollRef}
      />
    </>
  );
}

describe('MessageComposer', () => {
  beforeEach(() => {
    queryParams.delete('prompt');
  });

  it('preserves an in-progress draft when the composer owner changes', () => {
    render(
      <RecoilRoot>
        <ComposerOwnerSwap />
      </RecoilRoot>
    );

    const originalInput = screen.getByRole('textbox');
    fireEvent.change(originalInput, { target: { value: 'unfinished draft' } });
    expect(originalInput).toHaveValue('unfinished draft');

    fireEvent.click(
      screen.getByRole('button', { name: 'Swap composer owner' })
    );

    const remountedInput = screen.getByRole('textbox');
    expect(remountedInput).not.toBe(originalInput);
    expect(remountedInput).toHaveValue('unfinished draft');
  });

  it('starts with an empty draft when the chat session changes', () => {
    render(
      <RecoilRoot>
        <ComposerOwnerSwap />
      </RecoilRoot>
    );

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'previous chat draft' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start new session' }));

    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('does not restore a URL prompt over an edited draft after remounting', () => {
    queryParams.set('prompt', 'initial prompt');

    render(
      <RecoilRoot>
        <ComposerOwnerSwap />
      </RecoilRoot>
    );

    const originalInput = screen.getByRole('textbox');
    expect(originalInput).toHaveValue('initial prompt');
    fireEvent.change(originalInput, { target: { value: 'edited draft' } });

    fireEvent.click(
      screen.getByRole('button', { name: 'Swap composer owner' })
    );

    const remountedInput = screen.getByRole('textbox');
    expect(remountedInput).toHaveValue('edited draft');

    fireEvent.change(remountedInput, { target: { value: '' } });
    expect(remountedInput).toHaveValue('');
  });
});
