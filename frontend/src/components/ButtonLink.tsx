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
            className="text-muted-foreground hover:text-muted-foreground"
          >
            <a href={url} target="_blank">
              <img
                src={
                  iconUrl?.startsWith('/public')
                    ? apiClient.buildEndpoint(iconUrl)
                    : iconUrl
                }
                className={'h-6 w-6'}
                alt={name}
              />
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{name}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
