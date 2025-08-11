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
            'command-button p-2 h-9 text-[13px] font-medium rounded-full',
            'transition-all duration-300 ease-out',
            'transform-gpu overflow-hidden',
            isSelected && 'text-[#0066FF] command-selected',
            isAnimating && 'animate-bounce-subtle',
            !hasInitialized && 'opacity-0',
            hasInitialized && 'opacity-100'
          )}
          onClick={handleClick}
          style={{
            animationDelay: hasInitialized ? '0ms' : `${index * 50}ms`,
            '--hover-bg': 'hsl(var(--muted))',
            '--hover-color': isSelected ? '#0066FF' : 'inherit'
          } as React.CSSProperties}
        >
          <div className="flex items-center">
            <Icon 
              name={command.icon} 
              className={cn(
                "!h-5 !w-5 transition-colors duration-200",
                isSelected && "text-[#0066FF]"
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
                "ml-1 transition-all duration-300 flex items-center",
                isSelected ? "w-4 opacity-60" : "w-0 opacity-0"
              )}
            >
              <X className="!size-4 text-[#0066FF]" />
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
  const selectedCommand = commands.find(c => c.id === selectedCommandId && !c.button);
  
  // If no button commands and no selected non-button command, don't render
  if (!commandButtons.length && !selectedCommand) return null;

  return (
    <div className="flex gap-1 ml-1 flex-wrap command-buttons-container">
      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-2px) scale(1.05); }
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .command-button {
          position: relative;
        }
        
        /* Direct hover state without intermediate colors */
        .command-button:hover {
          background-color: var(--hover-bg) !important;
          color: var(--hover-color) !important;
        }
        
        .command-button:hover span,
        .command-button:hover svg {
          color: var(--hover-color) !important;
        }
        
        .command-selected::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 30%;
          height: 2px;
          background-color: #0066FF;
          border-radius: 1px;
          animation: expand-width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        @keyframes expand-width {
          0% { width: 0; }
          100% { width: 30%; }
        }
      `}</style>
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
