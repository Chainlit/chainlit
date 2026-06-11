
import React, { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Translator } from '@/components/i18n';
import { Sidebar } from '../icons/Sidebar';
import { useSidebar } from '../ui/sidebar';

const SidebarTrigger = forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  (props, ref) => {
    const { setOpen, open, openMobile, setOpenMobile, isMobile } = useSidebar();

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              {...props}
              ref={ref} // Transmission de la ref ici
              id="sidebar-trigger-button"
              onClick={() => (isMobile ? setOpenMobile(!openMobile) : setOpen(!open))}
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-muted-foreground"
            >
              <Sidebar className="!size-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {open ? (
                <Translator path="threadHistory.sidebar.actions.close" />
              ) : (
                <Translator path="threadHistory.sidebar.actions.open" />
              )}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

SidebarTrigger.displayName = 'SidebarTrigger';
export default SidebarTrigger;