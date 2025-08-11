import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import { every } from 'lodash';
import { Settings2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';

import { ICommand, commandsState } from '@chainlit/react-client';

import Icon from '@/components/Icon';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandItemAnimated,
  CommandListScrollable
} from '@/components/ui/command';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TOOLTIP_DELAY_MS
} from '@/components/ui/tooltip';

interface Props {
  disabled?: boolean;
  selectedCommandId?: string;
  onCommandSelect: (command: ICommand) => void;
}

export const CommandPopoverButton = ({
  disabled = false,
  selectedCommandId,
  onCommandSelect
}: Props) => {
  const commands = useRecoilValue(commandsState);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastMouseMove, setLastMouseMove] = useState(0);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const hoverTimerRef = useRef<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const allButtons = every(commands.map((c) => !!c.button));

  // Check if there's a selected non-button command
  const hasSelectedNonButtonCommand = commands.some(
    (c) => c.id === selectedCommandId && !c.button
  );

  const nonButtonCommands = commands.filter((c) => !c.button);

  // Handle animation when selection changes
  useEffect(() => {
    if (hasSelectedNonButtonCommand) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [hasSelectedNonButtonCommand]);

  // Ensure timers are cleared on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    };
  }, []);

  // Reset selection when opening and never show tooltip while popover is open
  useEffect(() => {
    if (open) {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      setTooltipOpen(false);
      setSelectedIndex(0);
      setLastMouseMove(0);
    }
  }, [open]);

  const scheduleTooltipOpen = () => {
    if (disabled) return;
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    hoverTimerRef.current = window.setTimeout(() => {
      setTooltipOpen(true);
    }, TOOLTIP_DELAY_MS);
  };

  const cancelTooltipOpen = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setTooltipOpen(false);
  };

  const handleMouseMove = (index: number) => {
    const now = Date.now();
    // Only update if mouse actually moved (not just from render)
    if (now - lastMouseMove > 50) {
      setSelectedIndex(index);
      setLastMouseMove(now);
    }
  };

  const handleMouseLeave = () => {
    // Keep the last hovered item selected when mouse leaves
    setLastMouseMove(Date.now());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || nonButtonCommands.length === 0) return;

    // Check if mouse was recently moved
    const timeSinceMouseMove = Date.now() - lastMouseMove;
    const isUsingKeyboard = timeSinceMouseMove > 100;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        if (isUsingKeyboard) {
          setSelectedIndex((prev) =>
            prev < nonButtonCommands.length - 1 ? prev + 1 : 0
          );
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        if (isUsingKeyboard) {
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : nonButtonCommands.length - 1
          );
        }
        break;

      case 'Enter': {
        e.preventDefault();
        e.stopPropagation();
        const selectedCmd = nonButtonCommands[selectedIndex];
        if (selectedCmd) {
          onCommandSelect(selectedCmd);
          setOpen(false);
          cancelTooltipOpen();
        }
        break;
      }

      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        cancelTooltipOpen();
        // Return focus to trigger button (tooltip won't open on focus)
        buttonRef.current?.focus();
        break;
    }
  };

  const handleCommandSelect = (command: ICommand) => {
    onCommandSelect(command);
    setOpen(false);
    cancelTooltipOpen();
  };

  if (!commands.length || allButtons) return null;

  return (
    <>
      <style>{`
        @keyframes command-shift {
          0% { transform: translateX(-10px); opacity: 0.8; }
          50% { transform: translateX(5px); }
          100% { transform: translateX(0); opacity: 1; }
        }

        .animate-command-shift {
          animation: command-shift 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .command-list-container::-webkit-scrollbar {
          width: 4px;
        }

        .command-list-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .command-list-container::-webkit-scrollbar-thumb {
          background-color: hsl(var(--muted-foreground) / 0.3);
          border-radius: 2px;
        }

        .command-list-container {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
        }

        .command-button-transition {
          transition: width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), 
                      padding 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      <div
        className={cn(
          'command-popover-wrapper',
          'transition-all duration-300 ease-out',
          isAnimating && 'animate-command-shift'
        )}
      >
        <Popover
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (v) cancelTooltipOpen(); // suppress tooltip while popover is open
          }}
        >
          <TooltipProvider>
            {/* Controlled tooltip so it only opens after our delay and never on focus */}
            <Tooltip open={!open && tooltipOpen}>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    ref={buttonRef}
                    id="command-button"
                    variant="ghost"
                    size="sm"
                    aria-haspopup="menu"
                    aria-expanded={open}
                    aria-controls="command-popover"
                    className={cn(
                      'flex items-center h-9 rounded-full font-medium text-[13px]',
                      'hover:bg-muted hover:dark:bg-muted transition-all duration-200',
                      'focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
                      'command-button-transition',
                      open && 'bg-muted/50',
                      hasSelectedNonButtonCommand ? 'p-2' : 'px-3 gap-1.5'
                    )}
                    disabled={disabled}
                    onMouseEnter={scheduleTooltipOpen}
                    onMouseLeave={cancelTooltipOpen}
                  >
                    <Settings2
                      className={cn(
                        '!size-5 transition-transform duration-200',
                        open && 'rotate-45'
                      )}
                    />
                    {!hasSelectedNonButtonCommand && (
                      <span className="overflow-hidden transition-all duration-300 opacity-100 w-auto max-w-[100px]">
                        Tools
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>{hasSelectedNonButtonCommand ? 'Change Tool' : 'Available Tools'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <PopoverContent
            id="command-popover"
            align="start"
            sideOffset={12}
            data-popover-content
            tabIndex={0}
            className={cn(
              'p-2 rounded-lg border shadow-md bg-background',
              'animate-in fade-in-0 zoom-in-95 duration-200',
              'focus:outline-none'
            )}
            onKeyDown={handleKeyDown}
            onMouseLeave={handleMouseLeave}
          >
            <Command className="overflow-hidden bg-transparent">
              <CommandListScrollable maxItems={5}>
                <CommandGroup className="p-0">
                  {nonButtonCommands.map((command, index) => (
                    <CommandItemAnimated
                      key={command.id}
                      index={index}
                      isSelected={index === selectedIndex}
                      onMouseMove={() => handleMouseMove(index)}
                      onSelect={() => handleCommandSelect(command)}
                      className="space-x-2"
                    >
                      <Icon
                        name={command.icon}
                        className={cn(
                          '!size-5 text-muted-foreground transition-transform duration-150',
                          index === selectedIndex && 'scale-110'
                        )}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{command.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {command.description}
                        </div>
                      </div>
                    </CommandItemAnimated>
                  ))}
                </CommandGroup>
              </CommandListScrollable>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
};

export default CommandPopoverButton;
