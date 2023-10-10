import { useRecoilState, useRecoilValue } from 'recoil';

import { Box, Stack } from '@mui/material';

import { chatProfile, projectSettingsState } from 'state/project';

export default function ChatProfiles() {
  const pSettings = useRecoilValue(projectSettingsState);
  const [chatProfileValue, setChatProfile] = useRecoilState(chatProfile);

  if (
    typeof pSettings === 'undefined' ||
    pSettings.chatProfiles.length <= 1 ||
    chatProfileValue
  ) {
    return null;
  }

  return (
    <Box p={2} alignSelf="center">
      <Stack direction="row" spacing={1}>
        {pSettings.chatProfiles.map((profile) => (
          <Box
            key={profile.name}
            sx={{ cursor: 'pointer' }}
            display="flex"
            justifyContent="center"
            border="1px solid"
            borderColor={'divider'}
            p={1}
            onClick={() => setChatProfile(profile.name)}
            title={profile.description}
            data-test={`chat-profile:${profile.name}`}
          >
            <img
              src={profile.icon}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                marginRight: '4px'
              }}
            />
            {profile.name}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
