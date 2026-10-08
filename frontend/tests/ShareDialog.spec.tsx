import { act, fireEvent, render, screen } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ChainlitAPI,
  ChainlitContext,
  threadHistoryState
} from '@chainlit/react-client';

import ShareDialog from '@/components/share/ShareDialog';

vi.mock('@/components/i18n', () => ({
  Translator: ({ path }: { path: string }) => <span>{path}</span>
}));

vi.mock('@chainlit/react-client', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@chainlit/react-client')>();
  const { atom } = await import('recoil');
  return {
    ...actual,
    threadHistoryState: atom({
      key: 'ShareDialogThreadHistory',
      default: { threads: [] }
    })
  };
});

describe('ShareDialog', () => {
  const threadId = 'thread-1';
  const clipboardDescriptor = Object.getOwnPropertyDescriptor(
    navigator,
    'clipboard'
  );
  let rootPathMeta: HTMLMetaElement;

  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) }
    });
    rootPathMeta = document.createElement('meta');
    rootPathMeta.setAttribute('property', 'og:root_path');
  });

  afterEach(() => {
    rootPathMeta.remove();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (clipboardDescriptor) {
      Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

  function renderDialog(rootPath: string | null, isShared = true) {
    if (rootPath !== null) {
      rootPathMeta.setAttribute('content', rootPath);
      document.head.appendChild(rootPathMeta);
    }
    const apiClient = new ChainlitAPI(window.location.origin, 'webapp');
    const shareThread = vi
      .spyOn(apiClient, 'shareThread')
      .mockResolvedValue({ success: true });

    render(
      <RecoilRoot
        initializeState={({ set }) => {
          set(threadHistoryState, {
            threads: [
              {
                id: threadId,
                createdAt: '2026-01-01',
                steps: [],
                metadata: { is_shared: isShared }
              }
            ]
          });
        }}
      >
        <ChainlitContext.Provider value={apiClient}>
          <ShareDialog open={true} onOpenChange={vi.fn()} threadId={threadId} />
        </ChainlitContext.Provider>
      </RecoilRoot>
    );

    return shareThread;
  }

  it.each([
    [null, '/share/thread-1'],
    ['', '/share/thread-1'],
    ['/', '/share/thread-1'],
    ['/chat', '/chat/share/thread-1'],
    ['/apps-internal/chat', '/apps-internal/chat/share/thread-1'],
    ['/apps-internal/chat/', '/apps-internal/chat/share/thread-1']
  ])(
    'displays and copies the share link with root path %s',
    async (rootPath, path) => {
      const shareThread = renderDialog(rootPath);
      const expectedUrl = `${window.location.origin}${path}`;

      expect(screen.getByText(expectedUrl)).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', {
            name: 'threadHistory.thread.actions.share.button'
          })
        );
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedUrl);
      expect(shareThread).not.toHaveBeenCalled();
    }
  );

  it('copies the prefixed link when sharing a thread for the first time', async () => {
    const shareThread = renderDialog('/chat', false);

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: 'threadHistory.thread.actions.share.button'
        })
      );
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(shareThread).toHaveBeenCalledWith(threadId, true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/chat/share/thread-1`
    );
  });
});
