import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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

interface AnimatedCommandButtonProps {
  command: ICommand;
  isSelected: boolean;
  disabled: boolean;
  onCommandSelect: (command?: ICommand) => void;
  index: number;
}

const AnimatedCommandButton = ({
  command,
  isSelected,
  disabled,
  onCommandSelect,
  index
}: AnimatedCommandButtonProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Prevent initial animation on mount
    const timer = setTimeout(() => setHasInitialized(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    setIsAnimating(true);
    onCommandSelect(isSelected ? undefined : command);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={buttonRef}
          id={`command-${command.id}`}
          variant="ghost"
          disabled={disabled}
          className={cn(
            'command-button relative p-2 h-9 text-[13px] font-medium rounded-full',
            'transition-all duration-300 ease-out',
            'transform-gpu overflow-hidden',
            // Same hover background for both selected and unselected
            'hover:bg-muted',
            // Selected state: blue text color that persists on hover
            isSelected && 'text-command hover:text-command',
            isAnimating && 'animate-bounce-subtle',
            !hasInitialized && 'opacity-0',
            hasInitialized && 'opacity-100',
            // Underline animation for selected state
            isSelected &&
              'after:content-[""] after:absolute after:bottom-[-2px] after:left-1/2 after:-translate-x-1/2 after:w-[30%] after:h-[2px] after:bg-command after:rounded-[1px] after:animate-expand-width'
          )}
          onClick={handleClick}
          style={{
            animationDelay: hasInitialized ? '0ms' : `${index * 50}ms`
          }}
        >
          <div className="flex items-center">
            <Icon
              name={command.icon}
              className={cn(
                '!h-5 !w-5 transition-colors duration-200',
                isSelected && 'text-command'
              )}
            />
            <span
              className={cn(
                'ml-1.5 transition-all duration-300',
                isSelected
                  ? 'max-w-[200px] overflow-visible'
                  : 'max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap max-sm:hidden'
              )}
            >
              {command.id}
            </span>
            <div
              className={cn(
                'ml-1 transition-all duration-300 flex items-center',
                isSelected ? 'w-4 opacity-60' : 'w-0 opacity-0'
              )}
            >
              <X className="!size-4 text-command" />
            </div>
          </div>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{command.description}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export const CommandButtons = ({
  disabled = false,
  selectedCommandId,
  onCommandSelect
}: Props) => {
  const commands = useRecoilValue(commandsState);
  const commandButtons = commands.filter((c) => !!c.button);

  // Find the selected command if it's not a button command
  const selectedCommand = commands.find(
    (c) => c.id === selectedCommandId && !c.button
  );

  // If no button commands and no selected non-button command, don't render
  if (!commandButtons.length && !selectedCommand) return null;

  return (
    <div className="flex gap-1 ml-1 flex-wrap command-buttons-container">
      <TooltipProvider>
        {/* Show selected non-button command as a button */}
        {selectedCommand && (
          <AnimatedCommandButton
            key={selectedCommand.id}
            command={selectedCommand}
            isSelected={true}
            disabled={disabled}
            onCommandSelect={onCommandSelect}
            index={0}
          />
        )}

        {/* Show button commands */}
        {commandButtons.map((command, index) => (
          <AnimatedCommandButton
            key={command.id}
            command={command}
            isSelected={selectedCommandId === command.id}
            disabled={disabled}
            onCommandSelect={onCommandSelect}
            index={selectedCommand ? index + 1 : index}
          />
        ))}
      </TooltipProvider>
    </div>
  );
};

export default CommandButtons;
