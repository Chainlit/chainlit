import { beforeEach, describe, expect, it } from 'vitest';

import {
  LS_DISPLAY_MODE_KEY,
  resolveDisplayMode
} from '../../libs/copilot/src/resolveDisplayMode';

describe('resolveDisplayMode – config vs localStorage precedence', () => {
  beforeEach(() => {
    localStorage.removeItem(LS_DISPLAY_MODE_KEY);
  });

  it('explicit config wins over localStorage', () => {
    localStorage.setItem(LS_DISPLAY_MODE_KEY, 'floating');
    expect(resolveDisplayMode('sidebar')).toBe('sidebar');
  });

  it('falls back to localStorage when config omits displayMode', () => {
    localStorage.setItem(LS_DISPLAY_MODE_KEY, 'sidebar');
    expect(resolveDisplayMode(undefined)).toBe('sidebar');
  });

  it('defaults to floating when neither config nor localStorage is set', () => {
    expect(resolveDisplayMode(undefined)).toBe('floating');
  });
});
