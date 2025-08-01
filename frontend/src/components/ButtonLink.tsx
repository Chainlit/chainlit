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
  displayName?: string;
  iconUrl?: string;
  url: string;
}

export default function ButtonLink({
  name,
  displayName,
  iconUrl,
  url
}: ButtonLinkProps) {
  const apiClient = useContext(ChainlitContext);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={displayName ? 'default' : 'icon'}
            className="text-muted-foreground hover:text-muted-foreground"
          >
            <a
              href={url}
              target="_blank"
              className="inline-flex items-center gap-1"
            >
              <img
                src={
                  iconUrl?.startsWith('/public')
                    ? apiClient.buildEndpoint(iconUrl)
                    : iconUrl
                }
                className={'h-6 w-6'}
                alt={name}
              />
              {displayName && <span>{displayName}</span>}
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{name}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
