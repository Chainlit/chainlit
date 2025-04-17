export interface IMcp {
  name: string;
  tools: [{ name: string }];
  status: 'connected' | 'connecting' | 'failed';
  clientType: 'sse' | 'stdio';
  command?: string;
  args?: string;
  envs?: string;
  url?: string;
  headers?: string;
}
