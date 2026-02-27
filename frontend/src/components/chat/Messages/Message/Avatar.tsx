import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { useContext, useMemo } from 'react';

import {
  ChainlitContext,
  useChatSession,
  useConfig
} from '@chainlit/react-client';

import Icon from '@/components/Icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface Props {
  author?: string;
  hide?: boolean;
  isError?: boolean;
  iconName?: string;
}

const MessageAvatar = ({ author, hide, isError, iconName }: Props) => {
  const apiClient = useContext(ChainlitContext);
  const { chatProfile } = useChatSession();
  const { config } = useConfig();

  const selectedChatProfile = useMemo(() => {
    return config?.chatProfiles.find((profile) => profile.name === chatProfile);
  }, [config, chatProfile]);

  const avatarUrl = useMemo(() => {
    if (config?.ui?.default_avatar_file_url)
      return config?.ui?.default_avatar_file_url;
    const isAssistant = !author || author === config?.ui.name;
    if (isAssistant && selectedChatProfile?.icon) {
      return selectedChatProfile.icon;
    }
    return apiClient?.buildEndpoint(`/avatars/${author || 'default'}`);
  }, [apiClient, selectedChatProfile, config, author]);

  if (isError) {
    return (
      <span className={cn('inline-block', hide && 'invisible')}>
        <AlertCircle className="h-5 w-5 fill-destructive mt-[5px] text-destructive-foreground" />
      </span>
    );
  }

  // Render icon or avatar based on iconName
  const avatarContent = iconName ? (
    <span className="inline-flex">
      <Icon name={iconName} className="h-5 w-5 mt-[3px]" />
    </span>
  ) : (
    <Avatar className="h-5 w-5 mt-[3px]">
      <AvatarImage
        src={avatarUrl}
        alt={`Avatar for ${author || 'default'}`}
        className="bg-transparent"
      />
      <AvatarFallback className="bg-transparent">
        <Skeleton className="h-full w-full rounded-full" />
      </AvatarFallback>
    </Avatar>
  );

  return (
    <span className={cn('inline-block', hide && 'invisible')}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{avatarContent}</TooltipTrigger>
          <TooltipContent>
            <p>{author}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
};

export { MessageAvatar };
