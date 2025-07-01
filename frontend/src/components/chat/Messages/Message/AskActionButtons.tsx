import { MessageContext } from 'contexts/MessageContext';
import { useContext, useMemo } from 'react';

import { type IAction } from '@chainlit/react-client';

import Icon from '@/components/Icon';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const AskActionButton = ({ action }: { action: IAction }) => {
  const { loading, askUser } = useContext(MessageContext);

  const content = useMemo(() => {
    return action.icon
      ? action.label
      : action.label
      ? action.label
      : action.name;
  }, [action]);

  const icon = useMemo(() => {
    if (action.icon) return <Icon name={action.icon as any} />;
    return null;
  }, [action]);

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
      className={cn(
        "break-words h-auto min-h-10 whitespace-normal",
        action.fullWidth ? "w-full justify-start" : "",
        action.className,
        icon ? "gap-2" : ""
      )}
      id={action.id}
      onClick={() => {
        askUser?.callback(action);
      }}
      variant={action.variant as any || "outline"}
      size={action.size as any || "default"}
      style={customStyle}
      disabled={loading}
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

const AskActionButtons = ({
  messageId,
  actions
}: {
  messageId: string;
  actions: IAction[];
}) => {
  const { askUser } = useContext(MessageContext);

  const belongsToMessage = askUser?.spec.step_id === messageId;
  const isAskingAction = askUser?.spec.type === 'action';
  const filteredActions = actions.filter((a) => {
    return a.forId === messageId && askUser?.spec.keys?.includes(a.id);
  });

  if (!belongsToMessage || !isAskingAction || !actions.length) return null;

  // 检查是否有任何按钮设置了fullWidth属性
  const hasFullWidthButtons = filteredActions.some(a => a.fullWidth);

  return (
    <div className={cn(
      "flex gap-1",
      hasFullWidthButtons ? "flex-col w-full" : "items-center flex-wrap"
    )}>
      {filteredActions.map((a) => (
        <AskActionButton key={a.id} action={a} />
      ))}
    </div>
  );
};

export { AskActionButtons };
