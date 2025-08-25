import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@radix-ui/react-popover';
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
  TOOLTIP_DELAY_MS,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { useTranslation } from 'components/i18n/Translator';

import { useCommandNavigation } from '@/hooks/useCommandNavigation';

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
  const { t } = useTranslation();
  const commands = useRecoilValue(commandsState);
  const [open, setOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const hoverTimerRef = useRef<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const allButtons = every(commands.map((c) => !!c.button));

  // Check if there's a selected non-button command
  const hasSelectedNonButtonCommand = commands.some(
    (c) => c.id === selectedCommandId && !c.button
  );

  const nonButtonCommands = commands.filter((c) => !c.button);

  // Handle direct command selection (for mouse clicks)
  const handleCommandSelect = (command: ICommand) => {
    onCommandSelect(command);
    setOpen(false);
    cancelTooltipOpen();
  };

  const { selectedIndex, handleMouseMove, handleMouseLeave, handleKeyDown } =
    useCommandNavigation({
      items: nonButtonCommands,
      isOpen: open,
      onSelect: handleCommandSelect, // This will be used for keyboard selection
      onClose: () => {
        setOpen(false);
        cancelTooltipOpen();
        buttonRef.current?.focus();
      }
    });

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

  if (!commands.length || allButtons) return null;

  return (
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
                    'hover:bg-muted hover:dark:bg-muted transition-all duration-200 transition-width-padding',
                    'focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
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
                      {t('chat.input.tools')}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {hasSelectedNonButtonCommand
                  ? t('chat.input.changeTool')
                  : t('chat.input.availableTools')}
              </p>
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
            <CommandListScrollable maxItems={5} className="custom-scrollbar">
              <CommandGroup className="p-0">
                {nonButtonCommands.map((command, index) => (
                  <CommandItemAnimated
                    key={command.id}
                    index={index}
                    isSelected={index === selectedIndex}
                    onMouseMove={() => handleMouseMove(index)}
                    onSelect={() => handleCommandSelect(command)} // Direct call for mouse clicks
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
  );
};

export default CommandPopoverButton;
