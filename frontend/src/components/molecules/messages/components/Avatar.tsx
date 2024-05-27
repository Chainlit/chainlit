import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';

import Avatar from '@mui/material/Avatar';

import { useChatSession } from '@chainlit/react-client';

import { apiClientState } from 'state/apiClient';
import { projectSettingsState } from 'state/project';

interface Props {
  author: string;
  hide?: boolean;
}

const MessageAvatar = ({ author, hide }: Props) => {
  const { chatProfile } = useChatSession();
  const pSettings = useRecoilValue(projectSettingsState);

  const selectedChatProfile = useMemo(() => {
    return pSettings?.chatProfiles.find(
      (profile) => profile.name === chatProfile
    );
  }, [pSettings, chatProfile]);

  const apiClient = useRecoilValue(apiClientState);

  const avatarUrl = useMemo(() => {
    const isAssistant = !author || author === pSettings?.ui.name;
    if (isAssistant && selectedChatProfile?.icon) {
      return selectedChatProfile.icon;
    }
    return apiClient?.buildEndpoint(`/avatars/${author || 'default'}`);
  }, [apiClient, selectedChatProfile, pSettings, author]);

  return (
    <span className={`message-avatar`}>
      <Avatar
        sx={{
          width: '1.6rem',
          height: '1.6rem',
          bgcolor: 'transparent'
        }}
        src={hide ? undefined : avatarUrl}
      />
    </span>
  );
};

export { MessageAvatar };
