import { afterEach, describe, expect, it, vi } from 'vitest';

import { IMcp, IMcpPayload } from '..';
import {
  openMcpAuthorizationUrl,
  setMcpAwaitingSignIn,
  setMcpConnected,
  setMcpFailed
} from './mcp';

describe('openMcpAuthorizationUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([
    'https://auth.example.com/authorize?state=abc',
    'http://localhost:9000/authorize?state=abc'
  ])('opens %s in a new tab without an opener', (url) => {
    const open = vi.fn();
    vi.stubGlobal('window', { open });

    openMcpAuthorizationUrl(url);

    expect(open).toHaveBeenCalledWith(url, '_blank', 'noopener,noreferrer');
  });

  it.each(['javascript:alert(1)', 'data:text/html,hi', 'not a url'])(
    'refuses %s and says why in the console',
    (url) => {
      const open = vi.fn();
      vi.stubGlobal('window', { open });
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      openMcpAuthorizationUrl(url);

      expect(open).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledOnce();
    }
  );
});

describe('sign-in state updates', () => {
  const waiting: IMcp = {
    name: 'jira',
    tools: [],
    status: 'connecting',
    clientType: 'streamable-http',
    url: 'https://example.com/mcp',
    isUserProvided: true,
    useOAuth: true,
    authorizationUrl: 'https://auth.example.com/authorize?state=abc'
  };
  const connected: IMcpPayload = {
    name: 'jira',
    tools: [{ name: 'search' }],
    isUserProvided: true,
    url: 'https://example.com/mcp',
    headers: null,
    clientType: 'streamable-http'
  };

  it('marks a listed server connected and drops its sign-in link', () => {
    const [mcp] = setMcpConnected([waiting], connected);

    expect(mcp.status).toBe('connected');
    expect(mcp.tools).toEqual([{ name: 'search' }]);
    expect(mcp.authorizationUrl).toBeUndefined();
    expect(mcp.useOAuth).toBe(true);
  });

  it('does not bring back a server removed while it waited on sign-in', () => {
    expect(setMcpConnected([], connected)).toEqual([]);
    expect(setMcpFailed([], 'jira')).toEqual([]);
    expect(setMcpAwaitingSignIn([], 'jira', 'https://a.example.com')).toEqual(
      []
    );
  });

  it('gives the sign-in link only to a server that is still connecting', () => {
    const link = 'https://auth.example.com/authorize?state=late';
    const done: IMcp = { ...waiting, status: 'connected' };
    delete done.authorizationUrl;

    expect(setMcpAwaitingSignIn([done], 'jira', link)).toEqual([done]);
    expect(
      setMcpAwaitingSignIn([waiting], 'jira', link)[0].authorizationUrl
    ).toBe(link);
  });

  it('marks a failed sign-in failed and drops its link', () => {
    const [mcp] = setMcpFailed([waiting], 'jira');

    expect(mcp.status).toBe('failed');
    expect(mcp.authorizationUrl).toBeUndefined();
  });
});
