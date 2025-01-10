import { InfoIcon } from 'lucide-react';

import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import { NotificationCount, NotificationCountProps } from './NotificationCount';

interface InputLabelProps {
  id?: string;
  label: string | number;
  tooltip?: string;
  notificationsProps?: NotificationCountProps;
}

const InputLabel = ({
  id,
  label,
  tooltip,
  notificationsProps
}: InputLabelProps): JSX.Element => {
  return (
    <div className="flex justify-between w-full">
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className="text-xs font-semibold text-gray-500">
          {label}
        </Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="h-3 w-3 text-gray-600" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {notificationsProps && <NotificationCount {...notificationsProps} />}
    </div>
  );
};

export { InputLabel };
