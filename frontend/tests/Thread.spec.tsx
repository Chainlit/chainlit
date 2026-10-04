import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Home from '@/pages/Home';
import ThreadPage from '@/pages/Thread';

import { unavailableThreadIdState } from '@chainlit/react-client';

const { mockThreadId, mockClear } = vi.hoisted(() => ({
  mockThreadId: vi.fn(),
  mockClear: vi.fn()
}));

vi.mock('@chainlit/react-client', async () => {
  const { atom } = await vi.importActual<typeof import('recoil')>('recoil');
  return {
    unavailableThreadIdState: atom({
      key: 'test-unavailable-thread',
      default: undefined
    }),
    threadHistoryState: atom({ key: 'test-history', default: {} }),
    useConfig: () => ({ config: { threadResumable: true } }),
    useChatMessages: () => ({ threadId: mockThreadId() }),
    useChatInteract: () => ({ clear: mockClear })
  };
});
vi.mock('pages/Page', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));
vi.mock('@/components/ReadOnlyThread', () => ({
  ReadOnlyThread: ({ id }: { id: string }) => <div>History {id}</div>
}));
vi.mock('@/components/AutoResumeThread', () => ({
  default: () => <div>Resume</div>
}));
vi.mock('@/components/Loader', () => ({ Loader: () => <div>Loading</div> }));
vi.mock('@/components/chat', () => ({ default: () => <div>Chat input</div> }));

function showThread(unavailableId?: string, path = '/thread/old') {
  render(
    <RecoilRoot
      initializeState={({ set }) =>
        set(unavailableThreadIdState, unavailableId)
      }
    >
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/thread/:id?" element={<ThreadPage />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  );
}

describe('ThreadPage unavailable profile fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockThreadId.mockReturnValue(undefined);
  });

  it('shows private history without a loading loop or chat input', () => {
    showThread('old');
    expect(screen.getByText('History old')).toBeInTheDocument();
    expect(screen.queryByText('Resume')).not.toBeInTheDocument();
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    expect(screen.queryByText('Chat input')).not.toBeInTheDocument();
  });

  it('continues to resume other available threads', () => {
    showThread('another');
    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('keeps the normal resumed chat writable', () => {
    mockThreadId.mockReturnValue('old');
    showThread();
    expect(screen.getByText('Chat input')).toBeInTheDocument();
    expect(screen.queryByText('History old')).not.toBeInTheDocument();
  });

  it('does not treat the optional route without an id as unavailable', () => {
    showThread(undefined, '/thread');
    expect(screen.getByText('Chat input')).toBeInTheDocument();
    expect(screen.queryByText(/History/)).not.toBeInTheDocument();
    expect(mockClear).not.toHaveBeenCalled();
  });

  it.each(['/', '/thread'])(
    'clears an unavailable session before chatting at %s',
    (path) => {
      showThread('old', path);
      expect(mockClear).toHaveBeenCalledTimes(1);
    }
  );

  it('does not clear a normal session when returning home', () => {
    showThread(undefined, '/');
    expect(mockClear).not.toHaveBeenCalled();
  });
});
