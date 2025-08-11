import { cn } from '@/lib/utils';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { useRecoilValue } from 'recoil';

import { ICommand, commandsState } from '@chainlit/react-client';

import AutoResizeTextarea from '@/components/AutoResizeTextarea';
import Icon from '@/components/Icon';
import {
  Command,
  CommandGroup,
  CommandItemAnimated,
  CommandListScrollable
} from '@/components/ui/command';

interface Props {
  id?: string;
  className?: string;
  autoFocus?: boolean;
  placeholder?: string;
  selectedCommand?: ICommand;
  setSelectedCommand: (command: ICommand | undefined) => void;
  onChange: (value: string) => void;
  onPaste?: (event: any) => void;
  onEnter?: () => void;
}

export interface InputMethods {
  reset: () => void;
}

const Input = forwardRef<InputMethods, Props>(
  (
    {
      placeholder,
      id,
      className,
      autoFocus,
      selectedCommand,
      setSelectedCommand,
      onChange,
      onEnter,
      onPaste
    },
    ref
  ) => {
    const commands = useRecoilValue(commandsState);
    const [isComposing, setIsComposing] = useState(false);
    const [showCommands, setShowCommands] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [commandInput, setCommandInput] = useState('');
    const [value, setValue] = useState('');
    const [lastMouseMove, setLastMouseMove] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const reset = () => {
      setValue('');
      if (!selectedCommand?.persistent) {
        setSelectedCommand(undefined);
      }
      setSelectedIndex(0);
      setCommandInput('');
      setShowCommands(false);
      onChange('');
    };

    useImperativeHandle(ref, () => ({
      reset
    }));

    useEffect(() => {
      if (textareaRef.current && autoFocus) {
        textareaRef.current.focus();
      }
    }, [autoFocus]);

    const normalizedInput = commandInput.toLowerCase().slice(1);

    const filteredCommands = commands
      .filter((command) => command.id.toLowerCase().includes(normalizedInput))
      .sort((a, b) => {
        const indexA = a.id.toLowerCase().indexOf(normalizedInput);
        const indexB = b.id.toLowerCase().indexOf(normalizedInput);
        return indexA - indexB;
      });

    useEffect(() => {
      // Reset selected index when filtered commands change
      setSelectedIndex(0);
      setLastMouseMove(0);
    }, [filteredCommands.length]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      onChange(newValue);

      // Command detection for dropdown
      const words = newValue.split(' ');
      if (words.length === 1 && words[0].startsWith('/')) {
        setShowCommands(true);
        setCommandInput(words[0]);
      } else {
        setShowCommands(false);
        setCommandInput('');
      }
    };

    const handleCommandSelect = (command: ICommand) => {
      setShowCommands(false);
      setSelectedCommand(command);

      // Remove the command text from the input
      const newValue = value.replace(commandInput, '').trimStart();
      setValue(newValue);
      onChange(newValue);

      setSelectedIndex(0);
      setCommandInput('');

      // Focus back on textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Handle command selection - check this FIRST before other key handling
      if (showCommands && filteredCommands.length > 0) {
        // Check if mouse was recently moved
        const timeSinceMouseMove = Date.now() - lastMouseMove;
        const isUsingKeyboard = timeSinceMouseMove > 100;

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            e.stopPropagation();
            if (isUsingKeyboard) {
              setSelectedIndex((prev) =>
                prev < filteredCommands.length - 1 ? prev + 1 : 0
              );
            }
            return;

          case 'ArrowUp':
            e.preventDefault();
            e.stopPropagation();
            if (isUsingKeyboard) {
              setSelectedIndex((prev) =>
                prev > 0 ? prev - 1 : filteredCommands.length - 1
              );
            }
            return;

          case 'Enter': {
            e.preventDefault();
            e.stopPropagation();
            const selectedCmd = filteredCommands[selectedIndex];
            if (selectedCmd) {
              handleCommandSelect(selectedCmd);
            }
            return;
          }

          case 'Escape':
            e.preventDefault();
            e.stopPropagation();
            setShowCommands(false);
            setCommandInput('');
            setSelectedIndex(0);
            return;

          case 'Tab': {
            e.preventDefault();
            e.stopPropagation();
            const tabCmd = filteredCommands[selectedIndex];
            if (tabCmd) {
              handleCommandSelect(tabCmd);
            }
            return;
          }
        }
      }

      // Handle regular enter only if command menu is not showing
      if (e.key === 'Enter' && !e.shiftKey && onEnter && !isComposing && !showCommands) {
        e.preventDefault();
        onEnter();
      }
    };

    return (
      <div className="relative w-full">
        <style>{`
          @keyframes slide-up {
            0% {
              opacity: 0;
              transform: translateY(10px) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .command-menu-animate {
            animation: slide-up 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .command-item-stagger {
            animation: slide-up 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
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
        `}</style>

        <AutoResizeTextarea
          ref={textareaRef}
          id={id}
          autoFocus={autoFocus}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={onPaste}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={placeholder}
          className={cn(
            'w-full resize-none bg-transparent placeholder:text-muted-foreground focus:outline-none',
            className
          )}
          maxHeight={250}
        />

        {showCommands && filteredCommands.length > 0 && (
          <div
            className="absolute z-50 left-0 command-menu-animate"
            style={{
              bottom: '100%',
              marginBottom: '12px'
            }}
            onMouseLeave={handleMouseLeave}
          >
            <Command className="rounded-lg border shadow-md bg-background">
              <CommandListScrollable maxItems={5}>
                <CommandGroup className="p-2">
                  {filteredCommands.map((command, index) => (
                    <CommandItemAnimated
                      key={command.id}
                      index={index}
                      isSelected={index === selectedIndex}
                      onMouseMove={() => handleMouseMove(index)}
                      onSelect={() => handleCommandSelect(command)}
                      className={cn(
                        'command-item space-x-2',
                        'command-item-stagger'
                      )}
                      style={{
                        animationDelay: `${index * 20}ms`
                      }}
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
          </div>
        )}
      </div>
    );
  }
);

export default Input;
