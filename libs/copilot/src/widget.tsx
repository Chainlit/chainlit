import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@chainlit/app/src/components/ui/popover";
import { Button } from "@chainlit/app/src/components/ui/button";
import { MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IWidgetConfig } from './types';
import Header from './components/Header';
import ChatWrapper from './chat';
import Alert from '@chainlit/app/src/components/Alert';

interface Props {
  config: IWidgetConfig;
  authError?: string;
}


const Widget = ({ config, authError }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const customClassName = config?.button?.tailwindClassname || "";

  return (
    <Popover onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          className={cn(
            "fixed h-16 w-16 rounded-full bottom-8 right-8 z-[20]",
            "transition-transform duration-300 ease-in-out",
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
                  "transition-opacity",
                  isOpen ? "opacity-0" : "opacity-100"
                )}
              />
            ) : (
              <MessageCircle 
                className={cn(
                  "!size-7 transition-opacity",
                  isOpen ? "opacity-0" : "opacity-100"
                )}
              />
            )}
            <X
              className={cn(
                "absolute !size-7 transition-all",
                isOpen ? 
                  "rotate-0 scale-100" : 
                  "rotate-90 scale-0"
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
          "flex flex-col",
          "transition-all duration-300 ease-in-out",
          expanded ? "w-[80vw]" : "w-[min(400px,80vw)]",
          "h-[min(730px,calc(100vh-150px))]",
          "overflow-hidden rounded-xl",
          "shadow-lg",
          "z-50",
          "animate-in fade-in-0 zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        )}
      >
        <div className="flex flex-col h-full w-full">
          {authError ? <Alert variant='error'>{authError}</Alert> : <>
            <Header expanded={expanded} setExpanded={setExpanded} />
          <div className="flex flex-grow pt-4 overflow-y-auto">
            <ChatWrapper />
            </div>
          </>}

   
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Widget;