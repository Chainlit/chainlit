import { fireEvent, render, screen } from '@testing-library/react';
import { RecoilRoot, useRecoilState } from 'recoil';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  IMessageElement,
  sideViewState,
  useChatData
} from '@chainlit/react-client';

import MessagesContainer from '@/components/chat/MessagesContainer';

vi.mock('@chainlit/react-client', async () => {
  const actual = await vi.importActual<typeof import('@chainlit/react-client')>(
    '@chainlit/react-client'
  );
  const { atom } = await import('recoil');
  return {
    ...actual,
    // The library and app have separate pnpm installations of Recoil in Vitest.
    messagesState: atom({ key: 'review-messages', default: [] }),
    sessionIdState: atom({ key: 'review-session', default: undefined }),
    sideViewState: atom({ key: 'review-side-view', default: undefined }),
    useChatData: vi.fn(),
    useChatInteract: () => ({ uploadFile: vi.fn() }),
    useChatMessages: () => ({ messages: [] }),
    useConfig: () => ({ config: { features: {} } })
  };
});

vi.mock('@/components/chat/Messages', async () => {
  const { ElementRef } = await import('@/components/Elements/ElementRef');
  return {
    Messages: ({ elements }: { elements: IMessageElement[] }) => (
      <div>
        {elements.map((element) => (
          <ElementRef key={element.id} element={element} />
        ))}
      </div>
    )
  };
});

vi.mock('@/components/i18n/Translator', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

function element(
  id: string,
  name = id,
  display: IMessageElement['display'] = 'side'
): IMessageElement {
  return {
    id,
    name,
    display,
    type: 'text',
    forId: 'review-message'
  };
}

function setElements(elements: IMessageElement[]) {
  vi.mocked(useChatData).mockReturnValue({
    elements,
    actions: [],
    loading: false
  } as ReturnType<typeof useChatData>);
}

function SideView() {
  const [view, setView] = useRecoilState(sideViewState);
  return view ? (
    <aside aria-label="Element preview" data-sidebar-key={view.key}>
      <p>{view.title}</p>
      <output aria-label="Preview IDs">
        {view.elements.map((element) => element.id).join(',')}
      </output>
      <output aria-label="Preview URL">{view.elements[0]?.url}</output>
      <button onClick={() => setView(undefined)}>Close preview</button>
    </aside>
  ) : null;
}

function App() {
  return (
    <RecoilRoot>
      <MessagesContainer />
      <SideView />
    </RecoilRoot>
  );
}

describe('MessagesContainer explicit preview intent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens only the selected element through the real element reference', () => {
    setElements([element('First'), element('Second')]);
    render(<App />);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'First' }));
    expect(screen.getByRole('complementary')).toHaveTextContent('First');
    expect(screen.getByRole('complementary')).not.toHaveTextContent('Second');
  });

  it('preserves a manual close across incoming updates and allows reopening', () => {
    setElements([element('First')]);
    const { rerender } = render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'First' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close preview' }));
    setElements([element('First'), element('Second')]);
    rerender(<App />);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Second' }));
    expect(screen.getByRole('complementary')).toHaveTextContent('Second');
  });

  it('does not replace a user-selected preview when another source arrives', () => {
    setElements([element('First')]);
    const { rerender } = render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'First' }));
    setElements([element('First'), element('Second')]);
    rerender(<App />);
    expect(screen.getByRole('complementary')).toHaveTextContent('First');
    expect(screen.getByRole('complementary')).not.toHaveTextContent('Second');
  });

  it('clears the old preview when a new empty thread replaces the elements', () => {
    setElements([element('First')]);
    const { rerender } = render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'First' }));
    setElements([]);
    rerender(<App />);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('refreshes an open preview when the selected element is updated', () => {
    setElements([{ ...element('First'), url: '/version-1.txt' }]);
    const { rerender } = render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'First' }));
    expect(screen.getByLabelText('Preview URL')).toHaveTextContent(
      '/version-1.txt'
    );
    setElements([{ ...element('First'), url: '/version-2.txt' }]);
    rerender(<App />);
    expect(screen.getByLabelText('Preview URL')).toHaveTextContent(
      '/version-2.txt'
    );
  });
  it('removes selected elements that are no longer available', () => {
    const first = element('First');
    const second = element('Second');
    setElements([first, second]);
    const { rerender } = render(
      <RecoilRoot
        initializeState={({ set }) =>
          set(sideViewState, {
            title: 'Selected elements',
            elements: [first, second]
          })
        }
      >
        <MessagesContainer />
        <SideView />
      </RecoilRoot>
    );

    setElements([second]);
    rerender(
      <RecoilRoot>
        <MessagesContainer />
        <SideView />
      </RecoilRoot>
    );

    expect(screen.getByLabelText('Preview IDs')).toHaveTextContent('Second');
    expect(screen.getByLabelText('Preview IDs')).not.toHaveTextContent('First');
  });

  it('keeps a page preview open while refreshing its element', () => {
    const page = element('Page', 'Page', 'page');
    setElements([page]);
    const { rerender } = render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'Page' }));

    setElements([{ ...page, url: '/updated-page.txt' }]);
    rerender(<App />);

    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByLabelText('Preview URL')).toHaveTextContent(
      '/updated-page.txt'
    );
  });

  it('preserves a custom title and sidebar key when content changes', () => {
    const selected = element('First');
    setElements([selected]);
    const { rerender } = render(
      <RecoilRoot
        initializeState={({ set }) =>
          set(sideViewState, {
            title: 'Custom title',
            key: 'server-key',
            elements: [selected]
          })
        }
      >
        <MessagesContainer />
        <SideView />
      </RecoilRoot>
    );
    setElements([{ ...selected, name: 'Renamed', url: '/updated.txt' }]);
    rerender(
      <RecoilRoot>
        <MessagesContainer />
        <SideView />
      </RecoilRoot>
    );
    expect(screen.getByRole('complementary')).toHaveTextContent('Custom title');
    expect(screen.getByLabelText('Preview URL')).toHaveTextContent(
      '/updated.txt'
    );
    expect(screen.getByRole('complementary')).toHaveAttribute(
      'data-sidebar-key',
      'server-key'
    );
  });

  it('updates the default preview title when the selected element is renamed', () => {
    setElements([element('First')]);
    const { rerender } = render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'First' }));
    setElements([element('First', 'Renamed')]);
    rerender(<App />);
    expect(screen.getByRole('complementary')).toHaveTextContent('Renamed');
  });
});
