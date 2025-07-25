export interface IMcp {
  name: string;
  tools: [{ name: string }];
  status: 'connected' | 'connecting' | 'failed';
  clientType: 'sse' | 'stdio' | 'streamable-http';
  command?: string;
  url?: string;
}
