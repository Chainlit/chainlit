import { useEffect, useState, useContext } from 'react';
import { useMediaQuery } from "react-responsive";

import Alert from '@chainlit/app/src/components/Alert';
import { Button } from '@chainlit/app/src/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@chainlit/app/src/components/ui/popover';


import ChatWrapper from './chat';
import { IWidgetConfig } from './types';
import Header from './components/Header';
import { WidgetContext } from './context';

import { cn } from '@/lib/utils';
import { MessageCircle, X } from 'lucide-react';

interface Props {
  config: IWidgetConfig;
  error?: string;
}

const Widget = ({ config, error }: Props) => {
  const { evoya } = useContext(WidgetContext)
  const [expanded, setExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [visualViewportHeight, setVisualViewportHeight] = useState(window.visualViewport?.height ?? window.innerHeight);
  const [visualViewportOffsetTop, setVisualViewportOffsetTop] = useState(window.visualViewport?.offsetTop ?? 0);

  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 768px)' })

  useEffect(() => {
    window.toggleChainlitCopilot = () => setIsOpen((prev) => !prev);

    return () => {
      window.toggleChainlitCopilot = () => console.error('Widget not mounted.');
    };
  }, []);


  const viewportHandler = () => {
    if (window.visualViewport) {
      setVisualViewportHeight(window.visualViewport.height);
      setVisualViewportOffsetTop(window.visualViewport.offsetTop);
    }
  }

  useEffect(() => {
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", viewportHandler);
      window.visualViewport.addEventListener("scroll", viewportHandler);
    }
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", viewportHandler);
        window.visualViewport.removeEventListener("scroll", viewportHandler);
      }
    }

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
            customClassName,
          )}
          style={{
            color: evoya.chainlitConfig.style.color,
            backgroundColor: evoya.chainlitConfig.style.bgcolor
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = evoya.chainlitConfig.style.bgcolorHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = evoya.chainlitConfig.style.bgcolor}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {evoya?.chainlitConfig.button?.imageUrl ? (
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
          'flex flex-col p-0 transition-all duration-300 ease-in-out bg-background',
          'overflow-hidden rounded-xl shadow-lg z-[9999]',
          'animate-in fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 md:relative',
          evoya?.chatBubbleConfig?.size === 'full_screen' && 'md:top-[95px] md:left-[10px]',
          expanded ? 'copilot-container-expanded' : 'copilot-container-collapsed'
        )}
        style={{
          width: isTabletOrMobile ? `100%` : evoya?.chatBubbleConfig?.size === 'full_screen'
            ? '98vw'
            : `calc(${evoya?.chatBubbleConfig?.width.replace('%', '')}vw - 3vw)`,
          inset: isTabletOrMobile && `${visualViewportOffsetTop}px 0px ${window.innerHeight - visualViewportOffsetTop}px 0px !important`,
          height: isTabletOrMobile ? `${visualViewportHeight - 120 }px` : evoya?.chatBubbleConfig?.size === 'full_screen'
            ? '98vh'
            : `calc(${evoya?.chatBubbleConfig?.height.replace('%', '')}vh - 13vh)`
        }}
      >
        <div id="chainlit-copilot" className="flex flex-col h-full w-full">
          {error ? (
            <Alert variant="error">{error}</Alert>
          ) : (
            <>
              <Header expanded={isOpen} setExpanded={setIsOpen} isPopup={true} />
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
