import { useCallback, useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';

import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Button } from '@mui/material';

import { useChatInteract, useConfig, useChatData } from '@chainlit/react-client';

import { BaseAssistant, assistantsState } from 'state/project';

export default function AssistantProfiles() {
  const { config } = useConfig();
  const { listAssistants, setSelectedAssistant } = useChatInteract();
  const [assistants, setAssistants] = useRecoilState(assistantsState);
  const { assistantSettingsInputs } = useChatData();
  const [showAll, setShowAll] = useState(false);

  const fetchAssistants = useCallback(async () => {
    try {
      const assistantsList = (await listAssistants()) as BaseAssistant[];
      setAssistants(assistantsList);
    } catch (error) {
      console.error('Error fetching assistants:', error);
      setAssistants([]);
    }
  }, [listAssistants, setAssistants]);

  useEffect(() => {
    fetchAssistants();
  }, [fetchAssistants]);

  if (typeof config === 'undefined' || !assistants || assistants.length === 0 || !assistantSettingsInputs || assistantSettingsInputs.length === 0) {
    return null;
  }

  const handleAssistantClick = (assistantName: string) => {
    setSelectedAssistant(assistantName);
  };

  const displayedAssistants = showAll ? assistants : assistants.slice(0, 5);

  return (
    <Box>
      <List>
        {displayedAssistants.map((assistant) => (
          <ListItem key={assistant.name} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => handleAssistantClick(assistant.name)}
              sx={{
                borderRadius: '12px',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              {assistant.icon && (
                <ListItemIcon sx={{ minWidth: '36px' }}>
                  <img
                    src={assistant.icon}
                    alt={assistant.name}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                </ListItemIcon>
              )}
              <ListItemText primary={assistant.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {assistants.length > 5 && (
        <Button 
          onClick={() => setShowAll(!showAll)}
          sx={{ mt: 1, width: '100%' }}
        >
          {showAll ? 'Show Less' : 'Show More'}
        </Button>
      )}
    </Box>
  );
}