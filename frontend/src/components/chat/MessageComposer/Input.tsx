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

import { useCommandNavigation } from '@/hooks/useCommandNavigation';

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
  setValueExtern: (v: string) => void;
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
    const [commandInput, setCommandInput] = useState('');
    const [value, setValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const normalizedInput = commandInput.toLowerCase().slice(1);

    const filteredCommands = commands
      .filter((command) => command.id.toLowerCase().includes(normalizedInput))
      .sort((a, b) => {
        const indexA = a.id.toLowerCase().indexOf(normalizedInput);
        const indexB = b.id.toLowerCase().indexOf(normalizedInput);
        return indexA - indexB;
      });

    const {
      selectedIndex,
      handleMouseMove,
      handleMouseLeave,
      handleKeyDown: navigationKeyDown
    } = useCommandNavigation({
      items: filteredCommands,
      isOpen: showCommands,
      onSelect: (command) => {
        handleCommandSelect(command);
      },
      onClose: () => {
        setShowCommands(false);
        setCommandInput('');
      }
    });

    const reset = () => {
      setValue('');
      if (!selectedCommand?.persistent) {
        setSelectedCommand(undefined);
      }
      setCommandInput('');
      setShowCommands(false);
      onChange('');
    };

    useImperativeHandle(ref, () => ({
      reset,
      setValueExtern: (v: string) => {
        console.log(v);
        setValue(v);
        onChange(v);
      }
    }));

    useEffect(() => {
      if (textareaRef.current && autoFocus) {
        textareaRef.current.focus();
      }
    }, [autoFocus]);

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

      setCommandInput('');

      // Focus back on textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Handle command selection - check this FIRST before other key handling
      if (showCommands && filteredCommands.length > 0) {
        navigationKeyDown(e);
        // If the navigation handled the key, don't process further
        if (e.defaultPrevented) {
          return;
        }
      }

      // Handle regular enter only if command menu is not showing
      if (
        e.key === 'Enter' &&
        !e.shiftKey &&
        onEnter &&
        !isComposing &&
        !showCommands
      ) {
        e.preventDefault();
        onEnter();
      }
    };

    return (
      <div className="relative w-full">
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
            className="absolute z-50 left-0 bottom-full mb-3 animate-slide-up"
            onMouseLeave={handleMouseLeave}
          >
            <Command className="rounded-lg border shadow-md bg-background">
              <CommandListScrollable maxItems={5} className="custom-scrollbar">
                <CommandGroup className="p-2">
                  {filteredCommands.map((command, index) => (
                    <CommandItemAnimated
                      key={command.id}
                      index={index}
                      isSelected={index === selectedIndex}
                      onMouseMove={() => handleMouseMove(index)}
                      onSelect={() => handleCommandSelect(command)}
                      className="command-item space-x-2"
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
