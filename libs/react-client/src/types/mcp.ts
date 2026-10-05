export interface IMcp {
  name: string;
  tools: Array<{ name: string }>;
  status: 'connected' | 'connecting' | 'failed';
  // Named (developer-configured) servers have 'type' set:
  type?: 'stdio' | 'sse' | 'streamable-http';
  // User-provided servers (SSE/HTTP only) have 'clientType' and 'url' set:
  clientType?: 'sse' | 'streamable-http';
  url?: string;
  headers?: Record<string, string>;
  // Explicitly marks a server connected via the user-provided flow, as
  // opposed to a named (developer-configured) server. Do not infer this
  // from the presence of 'url' or 'clientType'.
  isUserProvided?: boolean;
  // A user-provided server that signs the user in with OAuth. Named servers
  // turn OAuth on in the app's config instead.
  useOAuth?: boolean;
  // Set while the connection waits for the user to sign in at this URL.
  authorizationUrl?: string;
}

// A server as POST /mcp and `mcp_connected` describe it: there is no
// `status`, and `url`/`headers` are null for a named server.
export type IMcpPayload = Omit<IMcp, 'status' | 'url' | 'headers'> & {
  url: string | null;
  headers: Record<string, string> | null;
};

// POST /mcp answers with this when the user has to sign in before the
// connection can finish. The outcome then arrives over the socket as
// `mcp_connected` or `mcp_connection_failed`.
export interface IMcpAuthorizationRequired {
  status: 'authorization_required';
  url: string;
  mcp: IMcpPayload;
}
