import { i18nSetupLocalization } from '@/i18n';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Login from '@/pages/Login';

// Real i18next init (no backend plugin, so it resolves synchronously) --
// LoginForm's <Translator> calls i18n.exists() at render time and throws
// if no instance was ever initialized.
i18nSetupLocalization();

vi.mock('client-types/*', async () => {
  const { createContext } = await import('react');
  const mockApiClient = {
    buildEndpoint: (path: string) => `http://localhost:8000${path}`,
    getOAuthEndpoint: (provider: string) =>
      `http://localhost:8000/auth/oauth/${provider}`
  };
  return {
    ChainlitContext: createContext(mockApiClient),
    useAuth: () => ({
      data: { requireLogin: true, oauthProviders: [] },
      user: null,
      setUserFromAPI: vi.fn()
    })
  };
});

// Logo pulls useConfig() from @chainlit/react-client, which needs a
// RecoilRoot ancestor. It is unrelated to the error-render race under test,
// so stub it out rather than wiring up Recoil for this test.
vi.mock('@/components/Logo', () => ({
  Logo: () => null
}));

// jsdom does not implement matchMedia, and Login -> useTheme() calls it
// synchronously during render (not from an effect), so stub it the same way
// FavoriteButton.spec.tsx stubs ResizeObserver.
window.matchMedia =
  window.matchMedia ||
  vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }));

describe('Login', () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  afterEach(() => {
    if (root) {
      root.unmount();
      root = null;
    }
    if (container) {
      document.body.removeChild(container);
      container = null;
    }
  });

  // Regression test for the render race fixed by reading the ?error= query
  // param via a lazy useState initializer instead of an effect. Uses
  // createRoot + flushSync directly instead of Testing Library's render(),
  // because render() wraps in act(), which flushes passive effects
  // synchronously and hides the gap this test is pinning: what is in the DOM
  // on the very first commit, before any useEffect has run.
  it('renders the [role="alert"] error message on the first synchronous commit', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    flushSync(() => {
      root.render(
        <MemoryRouter initialEntries={['/login?error=some-error']}>
          <Login />
        </MemoryRouter>
      );
    });

    expect(container.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('renders no [role="alert"] on the first synchronous commit when there is no error param', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    flushSync(() => {
      root.render(
        <MemoryRouter initialEntries={['/login']}>
          <Login />
        </MemoryRouter>
      );
    });

    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});
