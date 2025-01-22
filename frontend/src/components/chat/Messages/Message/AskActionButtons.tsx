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

  const button = (
    <Button
      className="break-words h-auto min-h-10 whitespace-normal"
      id={action.id}
      onClick={() => {
        askUser?.callback(action);
      }}
      variant="outline"
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

  const isAskingAction = askUser?.spec.type === 'action';
  const filteredActions = actions.filter((a) => {
    return a.forId === messageId && askUser?.spec.keys?.includes(a.id);
  });

  if (!isAskingAction || !actions.length) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {filteredActions.map((a) => (
        <AskActionButton key={a.id} action={a} />
      ))}
    </div>
  );
};

export { AskActionButtons };
