import { Dispatch, SetStateAction, useContext, useEffect } from 'react';

import { ChainlitContext, useConfig } from '@chainlit/react-client';

import Markdown from '@/components/Markdown';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface Props {
  selectedChatProfile: string | undefined;
  setSelectedChatProfile: Dispatch<SetStateAction<string | undefined>>;
}

export default function CustomChatProfileSelector({
  selectedChatProfile,
  setSelectedChatProfile
}: Props) {
  const apiClient = useContext(ChainlitContext);
  const { config } = useConfig();
  // Early return check to prevent unnecessary renders and resource waste
  if (!config?.chatProfiles?.length || config.chatProfiles.length <= 1) {
    return null;
  }

  // Handle case when no profile is selected
  useEffect(() => {
    if (!selectedChatProfile) {
      setSelectedChatProfile(config.chatProfiles[0].name);
    }
  }, [selectedChatProfile, config.chatProfiles, setSelectedChatProfile]);

  // Handle case when selected profile becomes invalid
  useEffect(() => {
    if (selectedChatProfile) {
      const profileExists = config.chatProfiles.some(
        (profile) => profile.name === selectedChatProfile
      );
      if (!profileExists) {
        setSelectedChatProfile(config.chatProfiles[0].name);
      }
    }
  }, [selectedChatProfile, config.chatProfiles, setSelectedChatProfile]);

  const allowHtml = config?.features?.unsafe_allow_html;
  const latex = config?.features?.latex;

  return (
    <Select
      value={selectedChatProfile || ''}
      onValueChange={(value) => {
        setSelectedChatProfile(value);
      }}
    >
      <SelectTrigger
        id="chat-profiles"
        className="w-full border-none bg-transparent text-muted-foreground font-semibold text-lg hover:bg-accent"
      >
        <SelectValue placeholder="Select profile" />
      </SelectTrigger>
      <SelectContent>
        {config.chatProfiles.map((profile) => {
          const icon = profile.icon?.includes('/public')
            ? apiClient.buildEndpoint(profile.icon)
            : profile.icon;

          return (
            <HoverCard openDelay={100} closeDelay={0} key={profile.name}>
              <HoverCardTrigger asChild>
                <SelectItem
                  data-test={`select-item:${profile.name}`}
                  value={profile.name}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {icon && (
                      <img
                        src={icon}
                        alt={profile.name}
                        className="w-6 h-6 rounded-md object-cover"
                      />
                    )}
                    <span>{profile.name}</span>
                  </div>
                </SelectItem>
              </HoverCardTrigger>
              <HoverCardContent
                side="right"
                id="chat-profile-description"
                align="start"
                className="w-80 overflow-visible hidden sm:block"
                sideOffset={10}
              >
                <Markdown allowHtml={allowHtml} latex={latex}>
                  {profile.markdown_description}
                </Markdown>
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </SelectContent>
    </Select>
  );
}
