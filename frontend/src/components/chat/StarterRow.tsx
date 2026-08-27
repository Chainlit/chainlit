import { useContext } from 'react';

import { ChainlitContext, IStarter } from '@chainlit/react-client';

import { Button } from '@/components/ui/button';

import { useStarterSubmit } from '@/hooks/useStarterSubmit';

interface Props {
  starter: IStarter;
}

export default function StarterRow({ starter }: Props) {
  const apiClient = useContext(ChainlitContext);
  const { onSubmit, disabled } = useStarterSubmit(starter);

  const iconSrc = starter.icon?.startsWith('/public')
    ? apiClient.buildEndpoint(starter.icon)
    : starter.icon;

  return (
    <Button
      variant="ghost"
      className="starter-row w-full justify-start h-auto py-2 rounded-none"
      disabled={disabled}
      onClick={onSubmit}
    >
      {iconSrc && <img src={iconSrc} alt="" className="h-4 w-4 mr-2 rounded" />}
      <span className="text-sm text-left whitespace-normal break-words">
        {starter.label}
      </span>
    </Button>
  );
}
