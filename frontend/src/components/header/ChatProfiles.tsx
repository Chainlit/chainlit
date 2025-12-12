import { useContext, useEffect, useState } from 'react';

import {
  ChainlitContext,
  useChatInteract,
  useChatMessages,
  useChatSession,
  useConfig
} from '@chainlit/react-client';

import { Markdown } from '@/components/Markdown';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';

import { NewChatDialog } from './NewChat';

interface Props {
  navigate?: (to: string) => void;
}

export default function ChatProfiles({ navigate }: Props) {
  const apiClient = useContext(ChainlitContext);
  const { config } = useConfig();
  const { chatProfile, setChatProfile } = useChatSession();
  const { firstInteraction } = useChatMessages();
  const { clear } = useChatInteract();
  const [newChatProfile, setNewChatProfile] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Early return check to prevent unnecessary renders and resource waste
  if (!config?.chatProfiles?.length || config.chatProfiles.length <= 1) {
    return null;
  }

  // Handle case when no profile is selected
  useEffect(() => {
    if (!chatProfile) {
      setChatProfile(config.chatProfiles[0].name);
    }
  }, [chatProfile, config.chatProfiles, setChatProfile]);

  // Handle case when selected profile becomes invalid
  useEffect(() => {
    if (chatProfile) {
      const profileExists = config.chatProfiles.some(
        (profile) => profile.name === chatProfile
      );
      if (!profileExists) {
        setChatProfile(config.chatProfiles[0].name);
      }
    }
  }, [chatProfile, config.chatProfiles, setChatProfile]);

  const handleClose = () => {
    setOpenDialog(false);
    setNewChatProfile(null);
    navigate?.('/');
  };

  const handleConfirm = (profile: string) => {
    setChatProfile(profile);
    setNewChatProfile(null);
    clear();
    handleClose();
  };

  const allowHtml = config?.features?.unsafe_allow_html;
  const latex = config?.features?.latex;

  return (
    <div className="relative">
      <div id="chat-profiles" className="flex items-center gap-2">
        {config.chatProfiles.map((profile) => {
          const icon = profile.icon?.includes('/public')
            ? apiClient.buildEndpoint(profile.icon)
            : profile.icon;

          const isSelected = profile.name === chatProfile;

          return (
            <HoverCard openDelay={0} closeDelay={0} key={profile.name}>
              <HoverCardTrigger asChild>
                <Button
                  type="button"
                  data-test={`select-item:${profile.name}`}
                  onClick={() => {
                    const value = profile.name;
                    setNewChatProfile(value);
                    if (firstInteraction) {
                      setOpenDialog(true);
                    } else {
                      handleConfirm(value);
                    }
                  }}
                  variant={isSelected ? 'secondary' : 'ghost'}
                  className="h-9 px-3 text-sm font-semibold text-muted-foreground"
                >
                  <div className="flex items-center gap-2">
                    {icon && (
                      <img
                        src={icon}
                        alt={profile.display_name || profile.name}
                        className="w-6 h-6 rounded-md object-cover"
                      />
                    )}
                    <span>{profile.display_name || profile.name}</span>
                  </div>
                </Button>
              </HoverCardTrigger>
              <HoverCardContent
                side="right"
                id="chat-profile-description"
                align="start"
                className="w-80 overflow-visible"
                sideOffset={10}
              >
                <Markdown allowHtml={allowHtml} latex={latex}>
                  {profile.markdown_description}
                </Markdown>
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </div>
      <NewChatDialog
        open={openDialog}
        handleClose={handleClose}
        handleConfirm={() => newChatProfile && handleConfirm(newChatProfile)}
      />
    </div>
  );
}
