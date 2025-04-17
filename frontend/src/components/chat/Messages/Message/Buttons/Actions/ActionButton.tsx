import { MessageContext } from 'contexts/MessageContext';
import { useCallback, useContext, useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { toast } from 'sonner';

import {
  ChainlitContext,
  type IAction,
  sessionIdState
} from '@chainlit/react-client';

import Icon from '@/components/Icon';
import { Loader } from '@/components/Loader';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ActionProps {
  action: IAction;
}

const ActionButton = ({ action }: ActionProps) => {
  const { loading, askUser } = useContext(MessageContext);
  const apiClient = useContext(ChainlitContext);
  const sessionId = useRecoilValue(sessionIdState);
  const [isRunning, setIsRunning] = useState(false);

  const content = useMemo(() => {
    return action.label ? action.label : action.name;
  }, [action]);

  const icon = useMemo(() => {
    if (isRunning) return <Loader />;
    if (action.icon) return <Icon name={action.icon as any} />;
    return null;
  }, [action, isRunning]);

  const handleClick = useCallback(async () => {
    try {
      setIsRunning(true);
      await apiClient.callAction(action, sessionId);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setIsRunning(false);
    }
  }, [action, sessionId, apiClient]);

  const isAskingAction = askUser?.spec.type === 'action';
  const ignore = isAskingAction && askUser?.spec.keys?.includes(action.id);

  if (ignore) return null;

  // 创建自定义样式对象
  const customStyle = {};
  if (action.bgColor) {
    customStyle['backgroundColor'] = action.bgColor;
  }
  if (action.textColor) {
    customStyle['color'] = action.textColor;
  }

  const button = (
    <Button
      id={action.id}
      onClick={handleClick}
      size={action.size as any || "sm"}
      variant={action.variant as any || "ghost"}
      className={cn(
        action.fullWidth ? "w-full justify-start" : "",
        action.className,
        "text-muted-foreground",
        icon ? "gap-2" : ""
      )}
      style={customStyle}
      disabled={loading || isRunning}
    >
      {icon}
      {content}
    </Button>
  );

  if (action.tooltip) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{action.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } else {
    return button;
  }
};

export { ActionButton };
