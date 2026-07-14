import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChainlitAPI, ChainlitContext } from '@chainlit/react-client';

import { Logo } from '@/components/Logo';

vi.mock('@/components/ThemeProvider', () => ({
  useTheme: () => ({ variant: 'dark' })
}));

vi.mock('@chainlit/react-client', async () => {
  const actual = await vi.importActual('@chainlit/react-client');

  return {
    ...actual,
    useConfig: () => ({ config: undefined })
  };
});

describe('Logo', () => {
  it('prefers a provided theme variant over the app theme', () => {
    const apiClient = new ChainlitAPI('http://localhost:8000', 'copilot');
    const getLogoEndpoint = vi.spyOn(apiClient, 'getLogoEndpoint');

    render(
      <ChainlitContext.Provider value={apiClient}>
        <Logo themeVariant="light" />
      </ChainlitContext.Provider>
    );

    expect(getLogoEndpoint).toHaveBeenCalledWith('light', undefined);
  });
});
