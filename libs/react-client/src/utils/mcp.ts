import { IMcp, IMcpPayload } from '..';

/**
 * Open an MCP server's sign-in page in a new tab.
 *
 * The link comes from the server's OAuth metadata, so anything other than an
 * http(s) URL is refused rather than handed to the browser.
 */
export const openMcpAuthorizationUrl = (url: string) => {
  let protocol: string;
  try {
    protocol = new URL(url).protocol;
  } catch {
    console.warn('Not opening the MCP sign-in link: it is not a valid URL.');
    return;
  }
  if (protocol !== 'https:' && protocol !== 'http:') {
    console.warn(
      `Not opening the MCP sign-in link: ${protocol} links are not allowed.`
    );
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
};

// Updates for a connection that waits on the user's sign-in. Each one only
// touches a server that is still listed, so one removed while it waited stays
// removed.

// Only a server that is still connecting takes the link, so a late response
// can't send one that already connected or failed back to waiting.
export const setMcpAwaitingSignIn = (
  mcps: IMcp[],
  name: string,
  url: string
): IMcp[] =>
  mcps.map(
    (mcp): IMcp =>
      mcp.name === name && mcp.status === 'connecting'
        ? { ...mcp, authorizationUrl: url }
        : mcp
  );

export const setMcpConnected = (mcps: IMcp[], connected: IMcpPayload): IMcp[] =>
  mcps.map(
    (mcp): IMcp =>
      mcp.name === connected.name
        ? {
            ...mcp,
            status: 'connected',
            tools: connected.tools,
            authorizationUrl: undefined
          }
        : mcp
  );

export const setMcpFailed = (mcps: IMcp[], name: string): IMcp[] =>
  mcps.map(
    (mcp): IMcp =>
      mcp.name === name
        ? { ...mcp, status: 'failed', authorizationUrl: undefined }
        : mcp
  );
