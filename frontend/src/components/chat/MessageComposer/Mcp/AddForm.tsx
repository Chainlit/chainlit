import { useContext, useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import {
  ChainlitContext,
  mcpState,
  sessionIdState
} from '@chainlit/react-client';

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
  allowStdio?: boolean;
  allowSse?: boolean;
}

export const McpAddForm = ({
  onSuccess,
  onCancel,
  allowStdio,
  allowSse
}: McpAddFormProps) => {
  const apiClient = useContext(ChainlitContext);
  const sessionId = useRecoilValue(sessionIdState);
  const setMcps = useSetRecoilState(mcpState);

  const [serverName, setServerName] = useState('');
  const [serverType, setServerType] = useState<'stdio' | 'sse'>(
    allowStdio ? 'stdio' : 'sse'
  );
  const [serverUrl, setServerUrl] = useState('');
  const [serverCommand, setServerCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Form validation function
  const isFormValid = () => {
    if (!serverName.trim()) return false;

    if (serverType === 'stdio') {
      return !!serverCommand.trim();
    } else {
      return !!serverUrl.trim();
    }
  };

  const resetForm = () => {
    setServerName('');
    setServerType('stdio');
    setServerUrl('');
    setServerCommand('');
  };

  const addMcp = () => {
    setIsLoading(true);

    if (serverType === 'stdio') {
      toast.promise(
        apiClient
          .connectStdioMCP(sessionId, serverName, serverCommand)
          .then(async ({ success, mcp }) => {
            if (success && mcp) {
              setMcps((prev) => [...prev, { ...mcp, status: 'connected' }]);
            }
            resetForm();
            onSuccess();
          })
          .finally(() => setIsLoading(false)),
        {
          loading: 'Adding MCP...',
          success: () => 'MCP added!',
          error: (err) => <span>{err.message}</span>
        }
      );
    } else {
      toast.promise(
        apiClient
          .connectSseMCP(sessionId, serverName, serverUrl)
          .then(async ({ success, mcp }) => {
            if (success && mcp) {
              setMcps((prev) => [...prev, { ...mcp, status: 'connected' }]);
            }
            resetForm();
            onSuccess();
          })
          .finally(() => setIsLoading(false)),
        {
          loading: 'Adding MCP...',
          success: () => 'MCP added!',
          error: (err) => <span>{err.message}</span>
        }
      );
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 w-full">
          <div className="flex flex-col flex-grow gap-2">
            <Label htmlFor="server-name" className="text-foreground/70 text-sm">
              Name *
            </Label>
            <Input
              id="server-name"
              placeholder="Example: Stripe"
              className="w-full bg-background text-foreground border-input"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="server-type" className="text-foreground/70 text-sm">
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
                {allowSse ? <SelectItem value="sse">sse</SelectItem> : null}
                {allowStdio ? (
                  <SelectItem value="stdio">stdio</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="server-endpoint"
            className="text-foreground/70 text-sm"
          >
            {serverType === 'sse' ? 'Server URL *' : 'Command *'}
          </Label>
          <Input
            id="server-endpoint"
            placeholder={
              serverType === 'sse'
                ? 'Example: http://localhost:5000'
                : 'Example: npx -y @stripe/mcp --tools=all --api-key=YOUR_STRIPE_SECRET_KEY'
            }
            className="w-full bg-background text-foreground border-input"
            value={serverType === 'sse' ? serverUrl : serverCommand}
            onChange={(e) => {
              if (serverType === 'sse') {
                setServerUrl(e.target.value);
              } else {
                setServerCommand(e.target.value);
              }
            }}
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex justify-end items-center gap-2 mt-auto">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          <Translator path="common.actions.cancel" />
        </Button>
        <Button
          variant="default"
          onClick={addMcp}
          disabled={!isFormValid() || isLoading}
        >
          <Translator path="common.actions.confirm" />
        </Button>
      </div>
    </>
  );
};
