import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ModePicker } from '@/components/chat/MessageComposer/ModePicker';

import { mountShadowHost } from './testUtils';

vi.mock('@chainlit/react-client', async () => {
  const React = await import('react');
  return {
    ChainlitContext: React.createContext(undefined)
  };
});

const mode = {
  id: 'model',
  name: 'Model',
  options: [
    { id: 'fast', name: 'Fast' },
    { id: 'smart', name: 'Smart' }
  ]
};

const POPOVER_ID = '#mode-picker-popover-model';

const renderComponent = () =>
  render(<ModePicker mode={mode as any} onOptionSelect={vi.fn()} />);

describe('ModePicker — shadow DOM popover positioning', () => {
  it('portals the popover into the widget shadow root', () => {
    const shadowRoot = mountShadowHost();

    renderComponent();
    fireEvent.click(screen.getByRole('button'));

    // Content lives inside the encapsulated shadow tree, not the light DOM.
    expect(shadowRoot.querySelector(POPOVER_ID)).not.toBeNull();
    expect(document.body.querySelector(POPOVER_ID)).toBeNull();
  });

  it('falls back to document.body when no shadow root is set (standalone app)', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button'));

    expect(document.querySelector(POPOVER_ID)).not.toBeNull();
  });

  it('gives the popover content a stacking z-index above the chat', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button'));

    // jsdom has no layout engine, so we assert the stacking class Radix copies
    // onto the popper wrapper rather than computed geometry (covered by e2e).
    const content = document.querySelector(POPOVER_ID);
    expect(content?.classList.contains('z-[51]')).toBe(true);
  });
});
