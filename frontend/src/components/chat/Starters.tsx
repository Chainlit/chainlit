import { cn } from '@/lib/utils';
import { useMemo } from 'react';

import { useChatSession, useConfig } from '@chainlit/react-client';

import Starter from './Starter';

interface Props {
  className?: string;
}

export default function Starters({ className }: Props) {
  const { chatProfile } = useChatSession();
  const { config } = useConfig();

  const starters = useMemo(() => {
    if (chatProfile) {
      const selectedChatProfile = config?.chatProfiles.find(
        (profile) => profile.name === chatProfile
      );
      if (selectedChatProfile?.starters) {
        return selectedChatProfile.starters.slice(0, 4);
      }
    }
    return config?.starters;
  }, [config, chatProfile]);

  if (!starters?.length) return null;

  return (
    <div className={cn('flex gap-2 justify-center flex-wrap', className)}>
      {starters?.map((starter, i) => (
        <Starter key={i} starter={starter} />
      ))}
    </div>
  );
}
