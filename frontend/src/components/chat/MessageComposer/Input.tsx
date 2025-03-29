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

import Icon from '@/components/Icon';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList
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
  onEnter?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export interface InputMethods {
  reset: () => void;
}

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

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
    const contentEditableRef = useRef<HTMLDivElement>(null);
    const lastCommandSpanRef = useRef<HTMLElement | null>(null);
    const mutationObserverRef = useRef<MutationObserver | null>(null);
    const isUpdatingRef = useRef(false);

    const getContentWithoutCommand = () => {
      if (!contentEditableRef.current) return '';

      // Create a clone of the content
      const clone = contentEditableRef.current.cloneNode(
        true
      ) as HTMLDivElement;

      // Remove command span from clone
      const commandSpan = clone.querySelector('.command-span');
      if (commandSpan) {
        commandSpan.remove();
      }

      return (
        clone.innerHTML
          ?.replace(/<br\s*\/?>/g, '\n') // Convert <br> to newlines
          .replace(/<div>/g, '\n') // Convert <div> to newlines
          .replace(/<\/div>/g, '') // Remove closing div tags
          .replace(/&nbsp;/g, ' ') // Convert &nbsp; to spaces
          .replace(/<[^>]*>/g, '') // Remove any other HTML tags
          .replace(/&lt;/g, '<') // Convert &lt; back to
          .replace(/&gt;/g, '>') // Convert &gt; back to >
          .replace(/&amp;/g, '&')
          .replace('\u200B', '') || ''
      );
    };

    const reset = () => {
      if (!selectedCommand?.persistent) {
        setSelectedCommand(undefined);
      }
      setSelectedIndex(0);
      setCommandInput('');
      if (contentEditableRef.current) {
        contentEditableRef.current.innerHTML = '';
      }
      onChange('');
    };

    useImperativeHandle(ref, () => ({
      reset
    }));

    // Set up mutation observer to detect command span removal
    useEffect(() => {
      if (!contentEditableRef.current) return;

      contentEditableRef.current.focus();

      mutationObserverRef.current = new MutationObserver((mutations) => {
        if (isUpdatingRef.current) return;

        mutations.forEach((mutation) => {
          if (
            mutation.type === 'childList' &&
            mutation.removedNodes.length > 0
          ) {
            // Check if the removed node was our command span
            const wasCommandSpanRemoved = Array.from(
              mutation.removedNodes
            ).some((node) =>
              (node as HTMLElement).classList?.contains('command-span')
            );

            if (wasCommandSpanRemoved && !mutation.addedNodes.length) {
              handleCommandSelect(undefined);
            }
          }
        });
      });

      mutationObserverRef.current.observe(contentEditableRef.current, {
        childList: true,
        subtree: true
      });

      return () => {
        mutationObserverRef.current?.disconnect();
      };
    }, []);

    // Handle selectedCommand prop changes
    useEffect(() => {
      const content = contentEditableRef.current;
      if (!content) return;

      isUpdatingRef.current = true;

      try {
        // Find existing command span
        const existingCommandSpan = content.querySelector('.command-span');

        if (selectedCommand && !selectedCommand.button) {
          // Create new command block
          const newCommandBlock = document.createElement('div');
          newCommandBlock.className =
            'command-span font-bold inline-flex text-[#08f] items-center mr-1';
          newCommandBlock.contentEditable = 'false';
          newCommandBlock.innerHTML = `<span>${selectedCommand.id}</span>`;

          // Store reference to the command span
          lastCommandSpanRef.current = newCommandBlock;

          if (existingCommandSpan) {
            existingCommandSpan.replaceWith(newCommandBlock);
          } else {
            // Add new command span at the start
            if (content.firstChild) {
              content.insertBefore(newCommandBlock, content.firstChild);
            } else {
              content.appendChild(newCommandBlock);
            }
          }

          let textNode;

          // Create a text node after the command span if none exists
          if (!newCommandBlock.nextSibling) {
            textNode = document.createTextNode('\u200B');
            content.appendChild(textNode); // Zero-width space
          }

          // Ensure cursor is placed after the command span
          const selection = window.getSelection();
          const range = document.createRange();

          // Set cursor after the command span
          range.setStartAfter(textNode || newCommandBlock);
          range.collapse(true);

          // Apply the selection
          selection?.removeAllRanges();
          selection?.addRange(range);

          // Force focus on the content editable
          content.focus();
          selection?.addRange(range);

          // Trigger onChange with content excluding command
          onChange(getContentWithoutCommand());
        } else if (existingCommandSpan) {
          // Remove existing command span
          existingCommandSpan.remove();
          lastCommandSpanRef.current = null;
          onChange(getContentWithoutCommand());
        }
      } finally {
        // Use setTimeout to ensure all DOM updates are complete
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [selectedCommand, onChange]);

    const normalizedInput = commandInput.toLowerCase().slice(1);

    const filteredCommands = commands
      .filter((command) => command.id.toLowerCase().includes(normalizedInput))
      .sort((a, b) => {
        const indexA = a.id.toLowerCase().indexOf(normalizedInput);
        const indexB = b.id.toLowerCase().indexOf(normalizedInput);
        return indexA - indexB;
      });

    useEffect(() => {
      const textarea = contentEditableRef.current;
      if (!textarea || !onPaste) return;

      const handlePaste = (event: ClipboardEvent) => {
        event.preventDefault();

        const textData = event.clipboardData?.getData('text/plain');
        if (textData) {
          const escapedText = escapeHtml(textData);

          const htmlToInsert = escapedText.replace(/\n/g, '<br>');

          document.execCommand('insertHTML', false, htmlToInsert);

          textarea.focus();

          const inputEvent = new Event('input', {
            bubbles: true,
            composed: true
          });
          textarea.dispatchEvent(inputEvent);
        }
        onPaste(event);
      };

      // Use the capture phase to ensure we catch the event before it can bubble
      textarea.addEventListener('paste', handlePaste);

      return () => {
        textarea.removeEventListener('paste', handlePaste);
      };
    }, [onPaste]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      if (isUpdatingRef.current) return;

      const textContent = getContentWithoutCommand();
      onChange(textContent);

      // For command detection, use the full content including command input
      const fullContent = e.currentTarget.textContent || '';
      const words = fullContent.split(' ');

      if (words.length === 1 && words[0].startsWith('/')) {
        setShowCommands(true);
        setCommandInput(words[0]);
      } else {
        setShowCommands(false);
        setCommandInput('');
      }

      // If there's no real content, remove the <br>
      if (!fullContent.trim() || fullContent.trim() === '\u200B') {
        e.currentTarget.innerHTML = '';
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!showCommands) {
        if (e.key === 'Enter' && !e.shiftKey && onEnter && !isComposing) {
          e.preventDefault();
          onEnter(e);
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && filteredCommands.length > 0) {
        e.preventDefault();
        const selectedCommand = filteredCommands[selectedIndex];
        handleCommandSelect(selectedCommand);
      } else if (e.key === 'Escape') {
        setShowCommands(false);
      }
    };

    const handleCommandSelect = (command?: ICommand) => {
      setShowCommands(false);

      // Set a small timeout to ensure state updates are processed
      setTimeout(() => {
        setSelectedCommand(command);

        // Clean up the command input from contentEditable
        if (contentEditableRef.current && command && commandInput) {
          const content = contentEditableRef.current.textContent || '';
          const cleanedContent = content.replace(commandInput, '').trimStart();
          contentEditableRef.current.textContent = cleanedContent;
        }

        setSelectedIndex(0);
        setCommandInput('');
      }, 0);
    };

    return (
      <div className="relative w-full">
        <div
          id={id}
          autoFocus={autoFocus}
          ref={contentEditableRef}
          contentEditable
          data-placeholder={placeholder}
          className={cn(
            'min-h-10 max-h-[250px] whitespace-pre-wrap overflow-y-auto w-full focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground',
            className
          )}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
        />

        {showCommands && filteredCommands.length ? (
          <div className="absolute z-50 -top-4 left-0 -translate-y-full">
            <Command className="rounded-lg border shadow-md">
              <CommandList>
                <CommandGroup>
                  {filteredCommands.map((command, index) => (
                    <CommandItem
                      key={command.id}
                      onSelect={() => handleCommandSelect(command)}
                      className={cn(
                        'cursor-pointer command-item flex items-center space-x-2 p-2',
                        index === selectedIndex ? 'bg-accent' : ''
                      )}
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
          </div>
        ) : null}
      </div>
    );
  }
);

export default Input;
