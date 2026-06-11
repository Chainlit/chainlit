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
import { apiClient } from '@/lib/axios';

const BACKEND_URL = apiClient.defaults.baseURL as string;

interface Props {
  author?: string;
  hide?: boolean;
  isError?: boolean;
  iconName?: string;
}

const MessageAvatar = ({ author, hide, isError, iconName }: Props) => {
  const chainlit = useContext(ChainlitContext);
  const { chatProfile } = useChatSession();
  const { config } = useConfig();

  const selectedChatProfile = useMemo(() => {
    return config?.chatProfiles.find((profile) => profile.name === chatProfile);
  }, [config, chatProfile]);

  const avatarUrl = useMemo(() => {
    if (config?.ui?.default_avatar_file_url) {
      const url = config.ui.default_avatar_file_url;
      return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
    }
    const isAssistant = !author || author === config?.ui.name;
    if (isAssistant && selectedChatProfile?.icon) {
      return selectedChatProfile.icon;
    }
    return chainlit?.buildEndpoint(`/avatars/${author || 'default'}`);
  }, [chainlit, selectedChatProfile, config, author]);

  const avatarSize = config?.ui?.avatar_size;
  const sizeStyle = avatarSize
    ? { width: `${avatarSize}px`, height: `${avatarSize}px` }
    : undefined;

  if (isError) {
    return (
      <span className={cn('inline-block', hide && 'invisible')}>
        <AlertCircle className="h-5 w-5 fill-destructive mt-[5px] text-destructive-foreground" />
      </span>
    );
  }

  const avatarContent = iconName ? (
    <span className="inline-flex mt-[3px]">
      <Icon name={iconName} size={avatarSize ?? 20} />
    </span>
  ) : (
    <Avatar
      className={avatarSize ? 'mt-[3px]' : 'h-5 w-5 mt-[3px]'}
      style={sizeStyle}
    >
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