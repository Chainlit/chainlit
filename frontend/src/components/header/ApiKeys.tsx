import { KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useConfig } from '@chainlit/react-client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Translator } from 'components/i18n';

export default function ApiKeys() {
  const { config } = useConfig();
  const requiredKeys = !!config?.userEnv?.length;

  if (!requiredKeys) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to="/env">
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-muted-foreground"
            >
              <KeyRound className="!size-4" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            <Translator path="navigation.user.menu.apiKeys" />
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
