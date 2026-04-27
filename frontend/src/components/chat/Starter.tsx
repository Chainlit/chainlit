import { useContext } from 'react';

import { ChainlitContext, IStarter } from '@chainlit/react-client';

import { Button } from '@/components/ui/button';

import { useStarterSubmit } from '@/hooks/useStarterSubmit';

interface StarterProps {
  starter: IStarter;
}

export default function Starter({ starter }: StarterProps) {
  const apiClient = useContext(ChainlitContext);
  const { onSubmit, disabled } = useStarterSubmit(starter);

  return (
    <Button
      id={`starter-${starter.label.trim().toLowerCase().replaceAll(' ', '-')}`}
      variant="outline"
      className="w-fit justify-start rounded-3xl"
      disabled={disabled}
      onClick={onSubmit}
    >
      <div className="flex gap-2">
        {starter.icon ? (
          <img
            className="h-5 w-5 rounded-md"
            src={
              starter.icon?.startsWith('/public')
                ? apiClient.buildEndpoint(starter.icon)
                : starter.icon
            }
            alt={starter.label}
          />
        ) : null}
        <p className="text-sm text-muted-foreground truncate">
          {starter.label}
        </p>
      </div>
    </Button>
  );
}
