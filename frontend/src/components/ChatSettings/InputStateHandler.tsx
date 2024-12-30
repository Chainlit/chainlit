import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import { Badge } from '../ui/badge';

interface NotificationsProps {
  count?: number;
  showBadge?: boolean;
}

interface InputProps {
  description?: string;
  hasError?: boolean;
  id: string;
  label?: string;
  notificationsProps?: NotificationsProps;
  tooltip?: string;
  className?: string;
}

interface InputStateHandlerProps extends InputProps {
  children: React.ReactNode;
}

const InputStateHandler = ({
  children,
  description,
  id,
  label,
  notificationsProps,
  tooltip,
  className
}: InputStateHandlerProps): JSX.Element => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={id}
          className="flex items-center gap-2 text-sm font-medium"
        >
          {label}
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger type="button">
                  <Info className="text-muted-foreground !size-4" />
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {notificationsProps?.showBadge &&
          typeof notificationsProps.count === 'number' ? (
            <Badge variant="outline" className="ml-auto">
              {notificationsProps.count}
            </Badge>
          ) : null}
        </label>
      )}
      <div className="flex flex-col gap-2">
        {children}
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </div>
    </div>
  );
};

export { InputStateHandler };
export type { InputStateHandlerProps, InputProps, NotificationsProps };
