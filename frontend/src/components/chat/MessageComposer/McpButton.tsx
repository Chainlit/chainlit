import { Link, Plug, SquareTerminal, Trash2, Wrench } from 'lucide-react';
import { useContext, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { toast } from 'sonner';

import {
  ChainlitContext,
  mcpState,
  sessionIdState,
  useConfig
} from '@chainlit/react-client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Translator } from 'components/i18n';

interface Props {
  disabled?: boolean;
}

const McpButton = ({ disabled }: Props) => {
  const apiClient = useContext(ChainlitContext);
  const { config } = useConfig();
  const sessionId = useRecoilValue(sessionIdState);
  const [mcps, setMcps] = useRecoilState(mcpState);

  const isEnabled = !!config?.features.mcp;
  const [serverName, setServerName] = useState('');
  const [serverType, setServerType] = useState<'stdio' | 'sse'>('stdio');
  const [serverUrl, setServerUrl] = useState('');
  const [serverCommand, setServerCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('add');

  if (!isEnabled) return null;

  // Form validation function
  const isFormValid = () => {
    if (!serverName.trim()) return false;

    if (serverType === 'stdio') {
      return !!serverCommand.trim();
    } else {
      return !!serverUrl.trim();
    }
  };

  const closeDialog = () => {
    setOpen(false);
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
              setMcps((prev) => [...prev, mcp]);
            }
            resetForm();
            setActiveTab('list'); // Switch to list tab after adding
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
              setMcps((prev) => [...prev, mcp]);
            }
            resetForm();
            setActiveTab('list'); // Switch to list tab after adding
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

  const deleteMcp = (mcpName: string) => {
    setIsLoading(true);

    toast.promise(
      apiClient
        .disconnectMcp(sessionId, mcpName)
        .then(() => {
          setMcps((prev) => prev.filter((mcp) => mcp.name !== mcpName));
        })
        .finally(() => setIsLoading(false)),
      {
        loading: 'Removing MCP...',
        success: () => 'MCP removed!',
        error: (err) => <span>{err.message}</span>
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                disabled={disabled}
                variant="ghost"
                size="icon"
                className="hover:bg-muted relative"
              >
                <Plug className="!size-5" />
                {mcps?.length > 0 && (
                  <span className="absolute -top-0 -right-0 bg-primary text-primary-foreground text-[8px] font-medium rounded-full w-3 h-3 flex items-center justify-center">
                    {mcps.length}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>MCP Servers</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </DialogTrigger>
      <DialogContent
        id="mcp-servers"
        className="min-w-[50vw] min-h-[50vh] max-h-[85vh] flex flex-col gap-6 bg-background"
      >
        <DialogHeader>
          <DialogTitle>MCP Servers</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="add">Connect an MCP</TabsTrigger>
            <TabsTrigger value="list">My MCPs</TabsTrigger>
          </TabsList>

          <TabsContent
            value="add"
            className="flex flex-col flex-grow overflow-y-auto gap-6 p-1"
          >
            <div className="flex flex-col gap-4">
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
                    placeholder="Stripe"
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
                      <SelectItem value="stdio">stdio</SelectItem>
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
                      ? 'http://localhost:5000'
                      : 'npx -y @stripe/mcp --tools=all --api-key=YOUR_STRIPE_SECRET_KEY'
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
          </TabsContent>

          <TabsContent value="list" className="flex flex-col gap-4">
            {mcps && mcps.length > 0 ? (
              mcps.map((mcp, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <h3 className="font-medium">{mcp.name}</h3>
                      <Badge variant="outline">{mcp.clientType}</Badge>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will disconnect the MCP server "{mcp.name}".
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteMcp(mcp.name)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <div className="font-medium text-sm text-muted-foreground flex items-center">
                      {mcp.clientType === 'stdio' ? (
                        <SquareTerminal className="h-4 w-4 mr-2" />
                      ) : (
                        <Link className="h-4 w-4 mr-2" />
                      )}
                      {mcp.clientType === 'stdio' ? 'Command' : 'URL'}
                    </div>
                    <p className="text-sm truncate max-w-full bg-muted px-2 py-1 rounded font-mono">
                      {mcp.command || mcp.url || 'N/A'}
                    </p>
                  </div>

                  <div className="font-medium text-sm text-muted-foreground flex items-center">
                    <Wrench className="h-4 w-4 mr-2" />
                    Tools
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mcp.tools &&
                      mcp.tools.map((tool, toolIndex) => (
                        <Badge key={toolIndex} variant="secondary">
                          {tool.name}
                        </Badge>
                      ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No MCP servers connected</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setActiveTab('add')}
                >
                  Add your first MCP server
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end items-center gap-2 mt-auto">
          <Button variant="outline" onClick={closeDialog} disabled={isLoading}>
            <Translator path="common.actions.cancel" />
          </Button>
          {activeTab === 'add' && (
            <Button
              variant="default"
              onClick={addMcp}
              disabled={!isFormValid() || isLoading}
            >
              <Translator path="common.actions.confirm" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default McpButton;
