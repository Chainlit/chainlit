import { useContext } from 'react';

import {
  ChainlitContext,
  useChatSession,
  useConfig
} from '@chainlit/react-client';

export default function CustomChatProfileView() {
  const apiClient = useContext(ChainlitContext);
  const { config } = useConfig();
  const { chatProfile } = useChatSession();
  const chatProfileData = config?.chatProfiles.find(
    (profile) => profile.name === chatProfile
  );
  const chatProfileIcon = chatProfileData?.icon?.includes('/public')
    ? apiClient.buildEndpoint(chatProfileData.icon)
    : chatProfileData?.icon;

  // Early return check to prevent unnecessary renders and resource waste
  if (!config?.chatProfiles?.length || config.chatProfiles.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-lg">
      {chatProfileIcon && (
        <img
          src={chatProfileIcon}
          alt={chatProfileData?.name}
          className="w-6 h-6 rounded-md object-cover"
        />
      )}
      <span>{chatProfileData?.name}</span>
    </div>
  );
}
