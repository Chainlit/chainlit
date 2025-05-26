import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';
// Changed icon
import { useRecoilState } from 'recoil';

// Added Recoil import
import { elementSidebarVisibilityState } from '@chainlit/react-client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

// Added Recoil atom import

export default function ElementSidebarToggleButton() {
  const [isVisible, setIsVisible] = useRecoilState(
    elementSidebarVisibilityState
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            id="element-sidebar-toggle-button" // Changed ID
            onClick={() => setIsVisible(!isVisible)} // Changed onClick logic
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-muted-foreground"
          >
            {/* Changed Icon based on state */}
            {isVisible ? (
              <PanelLeftOpen className="!size-6" />
            ) : (
              <PanelRightOpen className="!size-6" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {/* Changed Tooltip content */}
          <p>{isVisible ? 'Hide element panel' : 'Show element panel'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
