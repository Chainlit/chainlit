import { Link, SquareTerminal, Trash2, Wrench } from 'lucide-react';
import { useContext, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { toast } from 'sonner';

import {
  ChainlitContext,
  IMcp,
  mcpState,
  sessionIdState
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
import { Translator } from 'components/i18n';

interface McpListProps {
  onAddNewClick: () => void;
}

export const McpList = ({ onAddNewClick }: McpListProps) => {
  const apiClient = useContext(ChainlitContext);
  const sessionId = useRecoilValue(sessionIdState);
  const [mcps, setMcps] = useRecoilState(mcpState);
  const [isLoading, setIsLoading] = useState(false);

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

  if (!mcps || mcps.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No MCP servers connected</p>
        <Button variant="outline" className="mt-4" onClick={onAddNewClick}>
          Add your first MCP server
        </Button>
      </div>
    );
  }

  return (
    <>
      {mcps.map((mcp, index) => (
        <McpItem
          key={index}
          mcp={mcp}
          onDelete={deleteMcp}
          isLoading={isLoading}
        />
      ))}
    </>
  );
};

interface McpItemProps {
  mcp: IMcp;
  onDelete: (name: string) => void;
  isLoading: boolean;
}

const McpItem = ({ mcp, onDelete, isLoading }: McpItemProps) => {
  return (
    <div className="border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <h3 className="font-medium">{mcp.name}</h3>
          <Badge variant="outline">{mcp.clientType}</Badge>
        </div>
        <DeleteMcpButton
          mcpName={mcp.name}
          onDelete={onDelete}
          disabled={isLoading}
        />
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
  );
};

interface DeleteMcpButtonProps {
  mcpName: string;
  onDelete: (name: string) => void;
  disabled: boolean;
}

const DeleteMcpButton = ({
  mcpName,
  onDelete,
  disabled
}: DeleteMcpButtonProps) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          disabled={disabled}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will disconnect the MCP server "{mcpName}". This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Translator path="common.actions.cancel" />
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => onDelete(mcpName)}
          >
            <Translator path="common.actions.confirm" />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
