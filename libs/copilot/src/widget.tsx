import { cn } from '@/lib/utils';
import { MessageCircle, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import Alert from '@chainlit/app/src/components/Alert';
import { Button } from '@chainlit/app/src/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@chainlit/app/src/components/ui/popover';
import { useConfig } from '@chainlit/react-client';

import Header from './components/Header';

import ChatWrapper from './chat';
import {
  clearChainlitCopilotThreadId,
  getChainlitCopilotThreadId
} from './state';
import { IWidgetConfig } from './types';

interface Props {
  config: IWidgetConfig;
  error?: string;
}

const SIDEBAR_MIN_WIDTH = 300;
const SIDEBAR_DEFAULT_WIDTH = 400;
const SIDEBAR_MAX_WIDTH_RATIO = 0.5;
const LS_KEY = 'chainlit-copilot-displayMode';
const LS_WIDTH_KEY = 'chainlit-copilot-sidebarWidth';

const Widget = ({ config, error }: Props) => {
  const [expanded, setExpanded] = useState(config?.expanded || false);
  const [isOpen, setIsOpen] = useState(config?.opened || false);
  const [displayMode, setDisplayMode] = useState<'floating' | 'sidebar'>(
    () =>
      (localStorage.getItem(LS_KEY) as 'floating' | 'sidebar') ||
      config?.displayMode ||
      'floating'
  );
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = localStorage.getItem(LS_WIDTH_KEY);
    return stored ? Number(stored) : SIDEBAR_DEFAULT_WIDTH;
  });
  const isDragging = useRef(false);
  const projectConfig = useConfig();

  useEffect(() => {
    window.toggleChainlitCopilot = () => setIsOpen((prev) => !prev);
    window.getChainlitCopilotThreadId = getChainlitCopilotThreadId;
    window.clearChainlitCopilotThreadId = clearChainlitCopilotThreadId;

    return () => {
      window.toggleChainlitCopilot = () => console.error('Widget not mounted.');
      window.getChainlitCopilotThreadId = () => null;

      window.clearChainlitCopilotThreadId = () =>
        console.error('Widget not mounted.');
    };
  }, []);

  // Persist displayMode to localStorage
  useEffect(() => {
    localStorage.setItem(LS_KEY, displayMode);
  }, [displayMode]);

  // Persist sidebar width to localStorage
  useEffect(() => {
    localStorage.setItem(LS_WIDTH_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  // Drag-to-resize logic
  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const maxWidth = window.innerWidth * SIDEBAR_MAX_WIDTH_RATIO;
      const newWidth = Math.min(
        maxWidth,
        Math.max(SIDEBAR_MIN_WIDTH, window.innerWidth - e.clientX)
      );
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Manage body margin for sidebar mode
  useEffect(() => {
    if (displayMode === 'sidebar' && isOpen) {
      const originalMargin = document.body.style.marginRight;
      document.body.style.transition = 'margin-right 0.3s ease-in-out';
      document.body.style.marginRight = `${sidebarWidth}px`;
      return () => {
        document.body.style.marginRight = originalMargin;
        document.body.style.transition = '';
      };
    }
  }, [displayMode, isOpen, sidebarWidth]);

  const customClassName = config?.button?.className || '';

  // Sidebar mode: early return before the Popover
  if (displayMode === 'sidebar') {
    if (!isOpen) {
      return (
        <Button
          id="chainlit-copilot-button"
          aria-expanded="false"
          className={cn(
            'fixed h-16 w-16 rounded-full bottom-8 right-8 z-[20]',
            'transition-transform duration-300 ease-in-out',
            customClassName
          )}
          onClick={() => setIsOpen(true)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {config?.button?.imageUrl ? (
              <img
                width="100%"
                src={config.button.imageUrl}
                alt="Chat bubble icon"
              />
            ) : (
              <MessageCircle className="!size-7" />
            )}
          </div>
        </Button>
      );
    }

    return (
      <div
        className="fixed top-0 right-0 h-full z-[50] bg-background border-l shadow-lg flex flex-col"
        style={{ width: sidebarWidth }}
      >
        <div
          data-testid="sidebar-drag-handle"
          onMouseDown={handleMouseDown}
          className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-primary/20 active:bg-primary/30 z-10"
        />
        <div id="chainlit-copilot-chat" className="flex flex-col h-full w-full">
          {error ? (
            <Alert variant="error">{error}</Alert>
          ) : (
            <>
              <Header
                expanded={expanded}
                setExpanded={setExpanded}
                projectConfig={projectConfig}
                displayMode={displayMode}
                setDisplayMode={setDisplayMode}
                setIsOpen={setIsOpen}
              />
              <div className="flex flex-grow overflow-y-auto">
                <ChatWrapper />
              </div>
            </>
          )}
        </div>
        {/* Hidden button for test compatibility */}
        <button
          id="chainlit-copilot-button"
          aria-expanded="true"
          className="hidden"
        />
      </div>
    );
  }

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
        <div id="chainlit-copilot-chat" className="flex flex-col h-full w-full">
          {error ? (
            <Alert variant="error">{error}</Alert>
          ) : (
            <>
              <Header
                expanded={expanded}
                setExpanded={setExpanded}
                projectConfig={projectConfig}
                displayMode={displayMode}
                setDisplayMode={setDisplayMode}
                setIsOpen={setIsOpen}
              />
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
