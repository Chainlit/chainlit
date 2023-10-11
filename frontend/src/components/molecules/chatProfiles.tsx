import { useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import { Box, Popover, ToggleButton, ToggleButtonGroup } from '@mui/material';

import { chatProfile, projectSettingsState } from 'state/project';

import Markdown from './markdown';

export default function ChatProfiles() {
  const pSettings = useRecoilValue(projectSettingsState);
  const [chatProfileValue, setChatProfile] = useRecoilState(chatProfile);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [chatProfileDescription, setChatProfileDescription] = useState('');

  if (
    typeof pSettings === 'undefined' ||
    pSettings.chatProfiles.length <= 1 ||
    chatProfileValue
  ) {
    return null;
  }

  const open = Boolean(anchorEl);

  return (
    <Box p={2} alignSelf="center">
      <ToggleButtonGroup
        color="primary"
        value={''}
        exclusive
        aria-label="Chat profile"
        aria-owns={open ? 'chat-profile-description' : undefined}
        aria-haspopup="true"
      >
        {pSettings.chatProfiles.map((profile) => (
          <ToggleButton
            key={profile.name}
            value={profile.name}
            onClick={() => setChatProfile(profile.name)}
            onMouseEnter={(e) => {
              setChatProfileDescription(profile.markdown_description);
              setAnchorEl(e.currentTarget.parentElement);
            }}
            onMouseLeave={() => setAnchorEl(null)}
            sx={{
              textTransform: 'none'
            }}
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
            />{' '}
            {profile.name}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Popover
        id="chat-profile-description"
        anchorEl={anchorEl}
        open={open}
        sx={{
          pointerEvents: 'none',
          marginTop: 1
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
        onClose={() => setAnchorEl(null)}
        disableRestoreFocus
      >
        <Box p={2} maxWidth="20rem">
          <Markdown content={chatProfileDescription} />
        </Box>
      </Popover>
    </Box>
  );
}
