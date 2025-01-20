import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Translator } from 'components/i18n';

import { Sidebar } from '../icons/Sidebar';
import { useSidebar } from '../ui/sidebar';

export default function SidebarTrigger() {
  const { setOpen, open, openMobile, setOpenMobile, isMobile } = useSidebar();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() =>
              isMobile ? setOpenMobile(!openMobile) : setOpen(!open)
            }
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
