import { act, fireEvent, render, screen } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { RecoilRoot, useRecoilValue } from 'recoil';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ThreadPage from '@/pages/Thread';

import {
  ChainlitAPI,
  ChainlitContext,
  IThread,
  currentThreadIdState,
  threadHistoryState,
  threadIdToResumeState
} from '@chainlit/react-client';

import { ThreadList } from '@/components/LeftSidebar/ThreadList';
import { SidebarProvider } from '@/components/ui/sidebar';

vi.mock('@chainlit/react-client', async () => ({
  ...(await vi.importActual<typeof import('@chainlit/react-client')>(
    '@chainlit/react-client'
  )),
  useConfig: () => ({
    config: { threadResumable: true, dataPersistence: true }
  })
}));

vi.mock('@/components/i18n', () => ({
  Translator: ({ path }: { path: string }) => <span>{path}</span>
}));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/pages/Page', () => ({
  default: ({ children }: PropsWithChildren) => <>{children}</>
}));
vi.mock('@/components/chat', () => ({
  default: () => <div>Current chat</div>
}));
vi.mock('@/components/LeftSidebar/ThreadOptions', () => ({
  default: ({ onDelete }: { onDelete: () => void }) => (
    <span
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.preventDefault();
        onDelete();
      }}
    >
      Delete thread
    </span>
  )
}));

const thread: IThread = {
  id: 'thread-to-delete',
  name: 'Saved conversation',
  createdAt: '2026-01-01T00:00:00Z',
  steps: []
};

function SessionState() {
  const location = useLocation();
  const currentThreadId = useRecoilValue(currentThreadIdState);
  const idToResume = useRecoilValue(threadIdToResumeState);
  const history = useRecoilValue(threadHistoryState);
  return (
    <output data-testid="session-state">
      {JSON.stringify({
        path: location.pathname,
        currentThreadId,
        idToResume,
        threads: history?.threads?.map((entry) => entry.id)
      })}
    </output>
  );
}

function renderThreadList(currentThreadId: string | undefined) {
  const client = new ChainlitAPI('http://localhost:8000', 'webapp');
  const deletion = vi.spyOn(client, 'deleteThread');
  const history = {
    threads: [thread],
    timeGroupedThreads: { Today: [thread] }
  };
  render(
    <RecoilRoot
      initializeState={({ set }) => {
        set(currentThreadIdState, currentThreadId);
        set(threadHistoryState, history);
      }}
    >
      <ChainlitContext.Provider value={client}>
        <MemoryRouter
          initialEntries={[`/thread/${currentThreadId ?? thread.id}`]}
        >
          <SidebarProvider>
            <ThreadList
              threadHistory={history}
              isFetching={false}
              isLoadingMore={false}
            />
            <Routes>
              <Route path="/thread/:id" element={<ThreadPage />} />
              <Route path="/" element={<div>New chat</div>} />
            </Routes>
            <SessionState />
          </SidebarProvider>
        </MemoryRouter>
      </ChainlitContext.Provider>
    </RecoilRoot>
  );
  return deletion;
}

function confirmDeletion() {
  fireEvent.click(screen.getByRole('button', { name: 'Delete thread' }));
  fireEvent.click(screen.getByText('common.actions.confirm'));
}

function sessionState() {
  return JSON.parse(screen.getByTestId('session-state').textContent!);
}

describe('ThreadList deletion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each([thread.id, undefined])(
    'leaves the active or resuming thread before deletion can resume it (%s)',
    async (currentThreadId) => {
      const deletion = renderThreadList(currentThreadId);
      deletion.mockImplementation(() => new Promise(() => {}));

      confirmDeletion();

      expect(sessionState()).toEqual({ path: '/', threads: [thread.id] });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      expect(deletion).toHaveBeenCalledWith(thread.id);
      expect(sessionState()).toEqual({ path: '/', threads: [thread.id] });
    }
  );

  it('keeps another active thread intact until deletion succeeds', async () => {
    const deletion = renderThreadList('other-thread');
    let resolveDeletion!: (value: unknown) => void;
    deletion.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDeletion = resolve;
        })
    );

    confirmDeletion();

    expect(sessionState()).toEqual({
      path: '/thread/other-thread',
      currentThreadId: 'other-thread',
      threads: [thread.id]
    });
    await act(async () => {
      resolveDeletion({});
    });
    expect(sessionState()).toEqual({
      path: '/',
      currentThreadId: 'other-thread',
      threads: []
    });
  });

  it('preserves the current thread and history when another deletion fails', async () => {
    const deletion = renderThreadList('other-thread');
    deletion.mockRejectedValue(new Error('Deletion failed'));

    confirmDeletion();
    await act(async () => {});

    expect(sessionState()).toEqual({
      path: '/thread/other-thread',
      currentThreadId: 'other-thread',
      threads: [thread.id]
    });
  });
});
