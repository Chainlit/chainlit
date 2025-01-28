import { cn } from '@/lib/utils';
import { MessageCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import Alert from '@chainlit/app/src/components/Alert';
import { Button } from '@chainlit/app/src/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@chainlit/app/src/components/ui/popover';

import Header from './components/Header';

import ChatWrapper from './chat';
import { IWidgetConfig } from './types';

interface Props {
  config: IWidgetConfig;
  error?: string;
}

const Widget = ({ config, error }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    window.toggleChainlitCopilot = () => setIsOpen((prev) => !prev);

    return () => {
      window.toggleChainlitCopilot = () => console.error('Widget not mounted.');
    };
  }, []);

  const customClassName = config?.button?.className || '';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id="chainlit-copilot-button"
          className={cn(
            'fixed h-16 w-16 rounded-full bottom-8 right-8 z-[20]',
            'transition-transform duration-300 ease-in-out',
            customClassName
          )}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {config?.button?.imageUrl ? (
              <img
                width="100%"
                src={config.button.imageUrl}
                alt="Chat bubble icon"
                className={cn(
                  'transition-opacity',
                  isOpen ? 'opacity-0' : 'opacity-100'
                )}
              />
            ) : (
              <MessageCircle
                className={cn(
                  '!size-7 transition-opacity',
                  isOpen ? 'opacity-0' : 'opacity-100'
                )}
              />
            )}
            <X
              className={cn(
                'absolute !size-7 transition-all',
                isOpen ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
              )}
            />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        side="top"
        align="end"
        sideOffset={12}
        className={cn(
          'flex flex-col p-0',
          'transition-all duration-300 ease-in-out bg-background',
          expanded ? 'w-[80vw]' : 'w-[min(400px,80vw)]',
          'h-[min(730px,calc(100vh-150px))]',
          'overflow-hidden rounded-xl',
          'shadow-lg',
          'z-50',
          'animate-in fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          expanded
            ? 'copilot-container-expanded'
            : 'copilot-container-collapsed'
        )}
      >
        <div id="chainlit-copilot" className="flex flex-col h-full w-full">
          {error ? (
            <Alert variant="error">{error}</Alert>
          ) : (
            <>
              <Header expanded={expanded} setExpanded={setExpanded} />
              <div className="flex flex-grow overflow-y-auto">
                <ChatWrapper />
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Widget;
