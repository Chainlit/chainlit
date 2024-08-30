import { useContext, useMemo } from 'react';
import { useRecoilValue } from 'recoil';

import { Avatar, Box, Typography } from '@mui/material';

import { ChainlitContext, useChatData } from '@chainlit/react-client';

import { selectedAssistantState } from 'state/project';

export default function SelectedAssistantDisplay() {
  const apiClient = useContext(ChainlitContext);
  const { assistantSettingsInputs } = useChatData();

  const selectedAssistant = useRecoilValue(selectedAssistantState);

  const assistantIcon = useMemo(() => {
    if (!selectedAssistant) return null;

    let icon = selectedAssistant.settings_values['icon'] || '/avatars/default';
    if (icon.startsWith('/public')) {
      icon = apiClient.buildEndpoint(icon);
    }
    return icon;
  }, [selectedAssistant, apiClient]);

  if (!selectedAssistant || !assistantSettingsInputs) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        padding: '4px 8px',
        borderRadius: '4px',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: (theme) => theme.palette.background.paper
      }}
    >
      <Avatar
        src={assistantIcon}
        alt={selectedAssistant.settings_values['name']}
        sx={{ width: 24, height: 24 }}
      />
      <Typography variant="body2">
        {selectedAssistant.settings_values['name']}
      </Typography>
    </Box>
  );
}
