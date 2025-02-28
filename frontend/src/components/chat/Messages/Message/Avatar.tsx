import { cn } from '@/lib/utils';
import { useContext, useMemo } from 'react';

import {
  ChainlitContext,
  useChatSession,
  useConfig
} from '@chainlit/react-client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import BlinkingCursor from '@/components/BlinkingCursor';

interface Props {
  author?: string;
  content?: string;
  hide?: boolean;
}

const MessageAvatar = ({ author, hide, content }: Props) => {
  const apiClient = useContext(ChainlitContext);
  const { chatProfile } = useChatSession();
  const { config } = useConfig();

  const selectedChatProfile = useMemo(() => {
    return config?.chatProfiles.find((profile) => profile.name === chatProfile);
  }, [config, chatProfile]);

  const avatarUrl = useMemo(() => {
    const isAssistant = !author || author === config?.ui.name;
    if (isAssistant && selectedChatProfile?.icon) {
      return selectedChatProfile.icon;
    }
    return apiClient?.buildEndpoint(`/avatars/${author || 'default'}`);
  }, [apiClient, selectedChatProfile, config, author]);

  const authorInitial = author ? author.charAt(0).toUpperCase() : '?';

  return (
    <span className={cn(content == '' ? 'flex items-center' : 'inline-block', hide && 'invisible')}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar className="h-6 w-6 mt-[2px] mr-2">
              <AvatarFallback className="bg-gray-200 text-gray-700 font-semibold flex items-center justify-center">
                {authorInitial}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            <p>{author}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {content == '' && <BlinkingCursor />}
    </span>
  );
};

export { MessageAvatar };
