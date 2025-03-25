import { useContext } from 'react';

import { ChainlitContext } from '@chainlit/react-client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

export interface ButtonLinkProps {
  name?: string;
  iconUrl?: string;
  url: string;
}

export default function ButtonLink({ name, iconUrl, url }: ButtonLinkProps) {
  const apiClient = useContext(ChainlitContext);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            <a href={url} target="_blank">
              {iconUrl ? (
                <img
                  src={
                    iconUrl.startsWith('/public')
                      ? apiClient.buildEndpoint(iconUrl)
                      : iconUrl
                  }
                  className={'h-6 w-6'}
                  alt={name}
                />
              ) : (
                <span>{name}</span>
              )}
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{name}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
