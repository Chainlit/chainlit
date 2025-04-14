import { cn } from '@/lib/utils';
import { useRecoilValue } from 'recoil';

import { ICommand, commandsState } from '@chainlit/react-client';

import Icon from '@/components/Icon';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface Props {
  disabled?: boolean;
  selectedCommandId?: string;
  onCommandSelect: (command?: ICommand) => void;
}

export const CommandButtons = ({
  disabled = false,
  selectedCommandId,
  onCommandSelect
}: Props) => {
  const commands = useRecoilValue(commandsState);
  const commandButtons = commands.filter((c) => !!c.button);

  if (!commandButtons.length) return null;

  return (
    <div className="flex gap-2 ml-1 flex-wrap">
      <TooltipProvider>
        {commandButtons.map((command) => (
          <Tooltip key={command.id}>
            <TooltipTrigger asChild>
              <Button
                id={`command-${command.id}`}
                variant="ghost"
                disabled={disabled}
                className={cn(
                  'p-2 h-9 text-[13px] font-medium rounded-full',
                  selectedCommandId === command.id &&
                    'border-transparent text-[#08f] hover:text-[#08f] bg-[#DAEEFF] hover:bg-[#BDDCF4] dark:bg-[#2A4A6D] dark:text-[#48AAFF] dark:hover:bg-[#1A416A]'
                )}
                onClick={() =>
                  selectedCommandId === command.id
                    ? onCommandSelect(undefined)
                    : onCommandSelect(command)
                }
              >
                <Icon name={command.icon} className="!h-5 !w-5" />
                {command.id}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{command.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
};

export default CommandButtons;
