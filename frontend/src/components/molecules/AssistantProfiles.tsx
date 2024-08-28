import { useCallback, useEffect, useState, useContext } from 'react';
import { useRecoilState } from 'recoil';

import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Button } from '@mui/material';

import { useChatInteract, useConfig, useChatData, ChainlitContext } from '@chainlit/react-client';

import { Assistant, assistantsState } from 'state/project';
import UserIcon from 'assets/user';

export default function AssistantProfiles() {
  const apiClient = useContext(ChainlitContext);
  const { config } = useConfig();
  const { listAssistants, setSelectedAssistant } = useChatInteract();
  const [assistants, setAssistants] = useRecoilState(assistantsState);
  const { assistantSettingsInputs } = useChatData();
  const [showAll, setShowAll] = useState(false);
  const [newAssistantOpen, setNewAssistantOpen] = useState<boolean>(false);

  // assistant to edit (set when clicking on the settings icon, just before opening the modal)
  const [editAssistant, setEditAssistant] = useState<any | null>(null);

  const fetchAssistants = useCallback(async () => {
    try {
      const assistantsList = (await listAssistants()) as Assistant[];
      setAssistants(assistantsList);
    } catch (error) {
      console.error('Error fetching assistants:', error);
      setAssistants([]);
    }
  }, [listAssistants, setAssistants]);

  useEffect(() => {
    fetchAssistants();
  }, [fetchAssistants]);

  if (!assistants || assistants.length === 0 || !assistantSettingsInputs || assistantSettingsInputs.length === 0) {
    return null;
  }

  const handleAssistantClick = (assistantName: string) => {
    setSelectedAssistant(assistantName);
  };

  const handleEditAssistant = async (assistant: BaseAssistant) => {
    try {
      const assistantsList = await listAssistants() as any[];
      const fullAssistant = assistantsList.find(a => a.name === assistant.name);
      if (fullAssistant) {
        console.log(fullAssistant)
        setEditAssistant(fullAssistant);
        setNewAssistantOpen(true);
      } else {
        console.error('Assistant not found in the list');
      }
    } catch (error) {
      console.error('Error fetching assistants:', error);
    }
  };

  const handleCloseModal = () => {
    setNewAssistantOpen(false);
  };

  const displayedAssistants = showAll ? assistants : assistants.slice(0, 5);

  return (
    <Box>
      <List>
        {displayedAssistants.map((assistant: Assistant) => (
          <ListItem key={assistant.settings_values['name']} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => handleAssistantClick(assistant.settings_values['name'])}
              sx={{
                borderRadius: '12px',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: '36px' }}>
                {assistant.settings_values['icon'] ? (
                  <img
                    src={apiClient.buildEndpoint(`/avatars/${assistant.settings_values['icon']}`)}
                    alt={assistant.settings_values['name']}
                    style={{
                      width: '24px',
                      height: '24px',
                    }}
                  />
                ) : (
                  <UserIcon sx={{ width: '24px', height: '24px', color: 'text.secondary' }} />
                )}
              </ListItemIcon>
              <ListItemText primary={assistant.settings_values['name']} />
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
      <AssistantCreationModal
        open={newAssistantOpen}
        handleClose={handleCloseModal}
        startValues={editAssistant}
      />
    </Box>
  );
}