import { useContext, useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import {
  ChainlitContext,
  mcpState,
  sessionIdState,
  useConfig
} from '@chainlit/react-client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Translator } from 'components/i18n';

interface McpAddFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const McpAddForm = ({ onSuccess, onCancel }: McpAddFormProps) => {
  const apiClient = useContext(ChainlitContext);
  const sessionId = useRecoilValue(sessionIdState);
  const setMcps = useSetRecoilState(mcpState);
  const { config } = useConfig();

  const configuredServers = config?.features.mcp?.servers ?? [];
  const userServersEnabled = !!config?.features.mcp?.user_servers?.enabled;

  // User-provided server form state
  const [serverName, setServerName] = useState('');
  const [serverType, setServerType] = useState<'sse' | 'streamable-http'>(
    'sse'
  );
  const [serverUrl, setServerUrl] = useState('');
  const [headersInput, setHeadersInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isUserFormValid = () => {
    if (!serverName.trim()) return false;
    if (!serverUrl.trim()) return false;
    return true;
  };

  const resetUserForm = () => {
    setServerName('');
    setServerType('sse');
    setServerUrl('');
    setHeadersInput('');
  };

  const connectNamedServer = (name: string) => {
    setIsLoading(true);
    toast.promise(
      apiClient
        .connectMcp(sessionId, name)
        .then(async (resp: any) => {
          const { success, mcp, error } = resp;
          if (!success) {
            throw new Error(error || 'Could not connect to the MCP server');
          }
          if (mcp) {
            setMcps((prev) => [...prev, { ...mcp, status: 'connected' }]);
          }
          onSuccess();
        })
        .finally(() => setIsLoading(false)),
      {
        loading: 'Connecting MCP...',
        success: () => 'MCP connected!',
        error: (err) => <span>{err.message}</span>
      }
    );
  };

  const addUserMcp = () => {
    setIsLoading(true);

    let headersObj: Record<string, string> | undefined;
    if (headersInput.trim()) {
      try {
        headersObj = JSON.parse(headersInput.trim());
      } catch (_err) {
        toast.error('Headers must be valid JSON');
        setIsLoading(false);
        return;
      }
    }

    toast.promise(
      apiClient
        .connectUserMcp(
          sessionId,
          serverName,
          serverType,
          serverUrl,
          headersObj
        )
        .then(async (resp: any) => {
          const { success, mcp, error } = resp;
          if (!success) {
            throw new Error(error || 'Could not connect to the MCP server');
          }
          if (mcp) {
            setMcps((prev) => [
              ...prev,
              {
                ...mcp,
                clientType: serverType,
                url: serverUrl,
                isUserProvided: true,
                status: 'connected'
              }
            ]);
          }
          resetUserForm();
          onSuccess();
        })
        .finally(() => setIsLoading(false)),
      {
        loading: 'Adding MCP...',
        success: () => 'MCP added!',
        error: (err) => <span>{err.message}</span>
      }
    );
  };

  const hasConfiguredServers = configuredServers.length > 0;
  const hasAnything = hasConfiguredServers || userServersEnabled;

  if (!hasAnything) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>
          No MCP servers are configured. Ask your administrator to add servers
          to the Chainlit config.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {hasConfiguredServers && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground/70">
            Available Servers
          </h3>
          <div className="flex flex-col gap-2">
            {configuredServers.map((server) => (
              <div
                key={server.name}
                className="flex items-center justify-between border rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{server.name}</span>
                  <Badge variant="outline">{server.type}</Badge>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  disabled={isLoading}
                  onClick={() => connectNamedServer(server.name)}
                >
                  Connect
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {userServersEnabled && (
        <div className="flex flex-col gap-4">
          {hasConfiguredServers && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-foreground/70 mb-4">
                Connect Your Own Server
              </h3>
            </div>
          )}

          <div className="flex gap-2 w-full">
            <div className="flex flex-col flex-grow gap-2">
              <Label
                htmlFor="server-name"
                className="text-foreground/70 text-sm"
              >
                Name *
              </Label>
              <Input
                id="server-name"
                placeholder="Example: My MCP Server"
                className="w-full bg-background text-foreground border-input"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="server-type"
                className="text-foreground/70 text-sm"
              >
                Type *
              </Label>
              <Select
                value={serverType}
                onValueChange={setServerType as any}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="server-type"
                  className="w-full bg-background text-foreground border-input"
                >
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sse">sse</SelectItem>
                  <SelectItem value="streamable-http">
                    streamable-http
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="server-url" className="text-foreground/70 text-sm">
              Server URL *
            </Label>
            <Input
              id="server-url"
              placeholder={
                serverType === 'sse'
                  ? 'Example: http://localhost:5000/sse'
                  : 'Example: http://localhost:8000/mcp'
              }
              className="w-full bg-background text-foreground border-input"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="headers" className="text-foreground/70 text-sm">
              Headers (JSON, optional)
            </Label>
            <Input
              id="headers"
              placeholder='Example: {"Authorization": "Bearer TOKEN"}'
              className="w-full bg-background text-foreground border-input font-mono"
              value={headersInput}
              onChange={(e) => setHeadersInput(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end items-center gap-2 mt-auto">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              <Translator path="common.actions.cancel" />
            </Button>
            <Button
              variant="default"
              onClick={addUserMcp}
              disabled={!isUserFormValid() || isLoading}
            >
              <Translator path="common.actions.confirm" />
            </Button>
          </div>
        </div>
      )}

      {hasConfiguredServers && !userServersEnabled && (
        <div className="flex justify-end items-center gap-2 mt-auto">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            <Translator path="common.actions.cancel" />
          </Button>
        </div>
      )}
    </div>
  );
};
