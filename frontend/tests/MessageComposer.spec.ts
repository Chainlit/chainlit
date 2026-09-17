import { describe, expect, it } from 'vitest';

import { shouldAutoFocusMessageComposer } from '../src/components/chat/MessageComposer/autoFocus';

describe('shouldAutoFocusMessageComposer', () => {
  it('keeps autofocus enabled for the copilot widget in a narrow host window', () => {
    expect(shouldAutoFocusMessageComposer('copilot', true)).toBe(true);
  });

  it('keeps the web app mobile behavior unchanged', () => {
    expect(shouldAutoFocusMessageComposer('webapp', true)).toBe(false);
    expect(shouldAutoFocusMessageComposer('webapp', false)).toBe(true);
  });
});
