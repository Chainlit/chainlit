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
}
