import { act, renderHook, screen } from '@testing-library/react';
import { type ReactNode, StrictMode } from 'react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import {
  RecoilRoot,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState
} from 'recoil';
import { describe, expect, it, vi } from 'vitest';

import ThreadPage from '@/pages/Thread';

import {
  type IMessageElement,
  elementState,
  sideViewState
} from '@chainlit/react-client';

import AutoResumeThread from '@/components/AutoResumeThread';
import {
  createMessageSideView,
  useSideElements
} from '@/components/chat/MessagesContainer/useSideElements';

vi.mock('@chainlit/react-client', async () => {
  const { atom } = await import('recoil');
  return {
    useConfig: () => ({ config: { threadResumable: true } }),
    useChatMessages: () => ({ threadId: 'active' }),
    threadHistoryState: atom({ key: 'navigationThreadHistory', default: {} }),
    elementState: atom({ key: 'navigationElements', default: [] }),
    sideViewState: atom({ key: 'navigationSideView', default: undefined })
  };
});

vi.mock('pages/Page', () => ({
  default: ({ children }: { children: ReactNode }) => children
}));

vi.mock('@/components/AutoResumeThread', () => ({
  default: vi.fn(() => null)
}));

vi.mock('@/components/Loader', () => ({ Loader: () => null }));

vi.mock('@/components/ReadOnlyThread', () => ({
  ReadOnlyThread: () => <div>Shared thread</div>
}));

vi.mock('@/components/chat', () => ({
  default: function Chat() {
    const elements = useRecoilValue(elementState);
    const setSideView = useSetRecoilState(sideViewState);
    useSideElements(elements, setSideView);
    return <div>Active thread</div>;
  }
}));

const source: IMessageElement = {
  id: 'source',
  name: 'Source',
  type: 'text',
  display: 'side',
  forId: 'message',
  url: 'https://example.com/text'
};

function renderActiveThread() {
  return renderHook(
    () => {
      const [panel, setPanel] = useRecoilState(sideViewState);
      const setElements = useSetRecoilState(elementState);
      const navigate = useNavigate();
      return { panel, setPanel, setElements, navigate };
    },
    {
      wrapper: ({ children }) => (
        <StrictMode>
          <RecoilRoot
            initializeState={({ set }) => set(elementState, [source])}
          >
            <MemoryRouter initialEntries={['/thread/active']}>
              <Routes>
                <Route path="/thread/:id" element={<ThreadPage />} />
                <Route path="/share/:id" element={<ThreadPage />} />
              </Routes>
              {children}
            </MemoryRouter>
          </RecoilRoot>
        </StrictMode>
      )
    }
  );
}

describe('side elements across thread navigation', () => {
  it('clears a page preview removed while the active thread is unmounted', () => {
    const { result } = renderActiveThread();
    const page = { ...source, display: 'page' as const };
    act(() => result.current.setElements([page]));
    act(() => result.current.setPanel(createMessageSideView([page])));
    act(() => result.current.navigate('/share/other'));
    act(() => result.current.setElements([]));
    act(() => result.current.navigate('/thread/active'));
    expect(result.current.panel).toBeUndefined();
  });

  it('clears stale automatic content when returning from a shared thread', () => {
    const { result } = renderActiveThread();
    expect(result.current.panel?.elements).toEqual([source]);

    act(() => result.current.navigate('/share/other'));
    expect(screen.getByText('Shared thread')).toBeInTheDocument();
    expect(screen.queryByText('Active thread')).not.toBeInTheDocument();

    // The live session receives remove_element while its chat is unmounted.
    act(() => result.current.setElements([]));
    expect(result.current.panel?.elements).toEqual([source]);

    act(() => result.current.navigate('/thread/active'));

    expect(screen.getByText('Active thread')).toBeInTheDocument();
    expect(result.current.panel).toBeUndefined();
  });

  it('keeps automatic content whose element still exists after returning', () => {
    const { result } = renderActiveThread();

    act(() => result.current.navigate('/share/other'));
    act(() => result.current.navigate('/thread/active'));

    expect(result.current.panel?.elements).toEqual([source]);
  });

  it('clears a side view opened in a shared thread when the active thread is empty', () => {
    const { result } = renderActiveThread();

    act(() => result.current.navigate('/share/other'));
    act(() => result.current.setPanel(createMessageSideView([source])));
    act(() => result.current.setElements([]));
    act(() => result.current.navigate('/thread/active'));

    expect(result.current.panel).toBeUndefined();
  });

  it.each([
    { name: 'title-only', elements: [] },
    { name: 'inline', elements: [{ ...source, display: 'inline' as const }] },
    { name: 'page', elements: [{ ...source, display: 'page' as const }] },
    { name: 'side', elements: [source] }
  ])(
    'preserves a programmatic $name sidebar after returning',
    ({ elements }) => {
      const { result } = renderActiveThread();
      const sidebar = { title: 'API sidebar', elements, key: 'api' };
      act(() => result.current.setPanel(sidebar));

      act(() => result.current.navigate('/share/other'));
      act(() => result.current.setElements([]));
      act(() => result.current.navigate('/thread/active'));

      expect(result.current.panel).toBe(sidebar);
    }
  );

  it('requests resume when navigating to a different private thread', () => {
    vi.mocked(AutoResumeThread).mockClear();
    const { result } = renderActiveThread();

    act(() => result.current.navigate('/thread/other'));

    expect(AutoResumeThread).toHaveBeenCalledWith({ id: 'other' }, {});
  });
});
