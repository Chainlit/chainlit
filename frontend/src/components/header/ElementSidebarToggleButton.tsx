import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import { useRecoilState } from 'recoil';

import { elementSidebarVisibilityState } from '@chainlit/react-client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

export default function ElementSidebarToggleButton() {
  const [isVisible, setIsVisible] = useRecoilState(
    elementSidebarVisibilityState
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            id="element-sidebar-toggle-button"
            onClick={() => setIsVisible(!isVisible)}
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-muted-foreground"
          >
            {isVisible ? (
              <PanelLeftOpen className="!size-6" />
            ) : (
              <PanelRightOpen className="!size-6" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isVisible ? 'Hide element panel' : 'Show element panel'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
