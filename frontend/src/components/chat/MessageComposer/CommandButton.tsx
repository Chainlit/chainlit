import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@radix-ui/react-popover';
import { useRecoilValue } from 'recoil';

import { ICommand, commandsState } from '@chainlit/react-client';

import Icon from '@/components/Icon';
import { ToolBox } from '@/components/icons/ToolBox';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface Props {
  disabled?: boolean;
  onCommandSelect: (command: ICommand) => void;
}

export const CommandButton = ({ disabled = false, onCommandSelect }: Props) => {
  const commands = useRecoilValue(commandsState);

  if (!commands.length) return null;

  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                id="command-button"
                variant="ghost"
                size="icon"
                className="hover:bg-muted"
                disabled={disabled}
              >
                <ToolBox className="!size-6" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Commands</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent
        align="start"
        sideOffset={12}
        className="focus:outline-none"
      >
        <Command className="rounded-lg border shadow-md">
          <CommandList>
            <CommandGroup>
              {commands.map((command) => (
                <CommandItem
                  key={command.id}
                  onSelect={() => onCommandSelect(command)}
                  className="command-item cursor-pointer flex items-center space-x-2 p-2"
                >
                  <Icon
                    name={command.icon}
                    className="!size-5 text-muted-foreground"
                  />
                  <div>
                    <div className="font-medium">{command.id}</div>
                    <div className="text-sm text-muted-foreground">
                      {command.description}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CommandButton;
