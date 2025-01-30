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

export default function ButtonLink({name, iconUrl, url }: ButtonLinkProps) {
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
                src={iconUrl}
                alt={name}
              />
            </a>
          </Button>
          </TooltipTrigger>
          <TooltipContent>
            { name }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
  );
}
