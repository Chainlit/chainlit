import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import type { IMessageElement } from '@chainlit/react-client';

import {
  createMessageSideView,
  useSideElements
} from '../src/components/chat/MessagesContainer/useSideElements';

const element = (id: string, autoExpand?: boolean): IMessageElement => ({
  id,
  name: id,
  type: 'text',
  display: 'side',
  forId: 'message',
  url: 'https://example.com/text',
  autoExpand
});

function renderPanel(elements: IMessageElement[]) {
  return renderHook(
    ({ elements }) => {
      const [panel, setPanel] = useState<{
        title: string;
        elements: IMessageElement[];
        key?: string;
      }>();
      useSideElements(elements, setPanel);
      return {
        panel,
        setPanel,
        close: () => setPanel(undefined),
        open: (el: IMessageElement) => setPanel(createMessageSideView([el]))
      };
    },
    { initialProps: { elements } }
  );
}

describe('side element arrivals', () => {
  it('clears an explicitly opened page preview when its element is removed', () => {
    const page: IMessageElement = { ...element('page'), display: 'page' };
    const { result, rerender } = renderPanel([page]);
    act(() => result.current.open(page));
    rerender({ elements: [] });
    expect(result.current.panel).toBeUndefined();
  });

  it('refreshes a page preview without replacing it with unrelated side arrivals', () => {
    const page: IMessageElement = { ...element('page'), display: 'page' };
    const { result, rerender } = renderPanel([page]);
    act(() => result.current.open(page));
    const sidebar = result.current.panel;
    const side = element('side');
    rerender({ elements: [page, side] });
    expect(result.current.panel).toBe(sidebar);
    const updated = {
      ...page,
      name: 'Updated page',
      url: 'https://example.com/new'
    };
    rerender({ elements: [updated, side] });
    expect(result.current.panel?.elements).toEqual([updated]);
    expect(result.current.panel?.title).toBe('Updated page');
  });

  it('closes a deleted page preview while quiet side elements remain', () => {
    const page: IMessageElement = { ...element('page'), display: 'page' };
    const side = element('side', false);
    const { result, rerender } = renderPanel([page, side]);
    act(() => result.current.open(page));
    rerender({ elements: [side] });
    expect(result.current.panel).toBeUndefined();
  });

  it('opens new elements by default', () => {
    const { result } = renderPanel([element('source')]);
    expect(result.current.panel?.title).toBe('source');
  });

  it('keeps a closed panel closed while opt-out sources arrive or update', () => {
    const first = element('first');
    const { result, rerender } = renderPanel([first]);
    act(() => result.current.close());
    const second = element('second', false);
    rerender({ elements: [first, second] });
    expect(result.current.panel).toBeUndefined();
    rerender({ elements: [first, { ...second, name: 'updated' }] });
    expect(result.current.panel).toBeUndefined();
  });

  it('allows an explicit open and keeps an open panel updated', () => {
    const first = element('first', false);
    const { result, rerender } = renderPanel([first]);
    expect(result.current.panel).toBeUndefined();
    act(() => result.current.open(first));
    const updated = { ...first, name: 'updated' };
    rerender({ elements: [updated] });
    expect(result.current.panel?.elements).toEqual([updated]);
  });

  it('opens a mixed batch when a changed element opts in', () => {
    const { result, rerender } = renderPanel([]);
    rerender({ elements: [element('quiet', false), element('default')] });
    expect(result.current.panel?.elements).toHaveLength(2);
  });

  it('clears side content on reset and ignores inline arrivals', () => {
    const { result, rerender } = renderPanel([element('first')]);
    rerender({ elements: [{ ...element('inline'), display: 'inline' }] });
    expect(result.current.panel).toBeUndefined();
    rerender({ elements: [element('quiet', false)] });
    expect(result.current.panel).toBeUndefined();
  });

  it.each(['inline', 'page'] as const)(
    'preserves a sidebar opened by title when a %s element arrives',
    (display) => {
      const { result, rerender } = renderPanel([]);
      const sidebar = { title: 'API sidebar', elements: [] };
      act(() => result.current.setPanel(sidebar));

      rerender({ elements: [{ ...element('arrival'), display }] });

      expect(result.current.panel).toBe(sidebar);
    }
  );

  it.each(['inline', 'page'] as const)(
    'preserves programmatic sidebar elements when a %s element arrives or updates',
    (display) => {
      const content: IMessageElement = {
        ...element('api-content'),
        display: 'inline'
      };
      const { result, rerender } = renderPanel([content]);
      const sidebar = { title: 'API sidebar', elements: [content], key: 'api' };
      act(() => result.current.setPanel(sidebar));
      const arrival: IMessageElement = { ...element('arrival'), display };

      rerender({ elements: [content, arrival] });
      expect(result.current.panel).toBe(sidebar);

      rerender({ elements: [content, { ...arrival, name: 'updated' }] });
      expect(result.current.panel).toBe(sidebar);
    }
  );

  it.each(['api-content', 'tracked'])(
    'preserves a replacement sidebar (%s) when tracked side content is removed',
    (id) => {
      const tracked = element('tracked');
      const content: IMessageElement = { ...element(id), display: 'inline' };
      const { result, rerender } = renderPanel([tracked]);
      const sidebar = { title: 'API sidebar', elements: [content], key: 'api' };
      act(() => result.current.setPanel(sidebar));

      rerender({ elements: [content] });

      expect(result.current.panel).toBe(sidebar);
    }
  );

  it('clears an explicitly opened side element when it is removed', () => {
    const quiet = element('quiet', false);
    const { result, rerender } = renderPanel([quiet]);
    act(() => result.current.open(quiet));

    rerender({ elements: [] });

    expect(result.current.panel).toBeUndefined();
  });

  it.each(['title', 'elements'])(
    'preserves a sidebar replaced by the %s API when its side element is removed',
    (update) => {
      const tracked = element('tracked');
      const { result, rerender } = renderPanel([tracked]);
      act(() =>
        result.current.setPanel((current) =>
          update === 'title'
            ? { title: 'Custom title', elements: current?.elements || [] }
            : {
                title: current?.title || '',
                elements: [tracked],
                key: 'api'
              }
        )
      );
      const sidebar = result.current.panel;

      rerender({ elements: [] });

      expect(result.current.panel).toBe(sidebar);
    }
  );

  it('keeps an explicitly opened page preview on unrelated inline arrivals', () => {
    const page: IMessageElement = { ...element('page'), display: 'page' };
    const { result, rerender } = renderPanel([page]);
    act(() => result.current.open(page));
    const sidebar = result.current.panel;

    rerender({ elements: [page, { ...element('inline'), display: 'inline' }] });

    expect(result.current.panel).toBe(sidebar);
  });
});
