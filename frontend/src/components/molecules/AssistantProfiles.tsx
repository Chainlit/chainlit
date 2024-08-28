import { useCallback, useContext, useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';

import SettingsIcon from '@mui/icons-material/Settings';
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import IconButton from '@mui/material/IconButton';

import {
  ChainlitContext,
  useChatData,
  useChatInteract
} from '@chainlit/react-client';

import AssistantCreationModal from 'components/organisms/chat/newAssistant';

import UserIcon from 'assets/user';

import { Assistant, assistantsState } from 'state/project';

export default function AssistantProfiles() {
  const apiClient = useContext(ChainlitContext);
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

  if (
    !assistants ||
    assistants.length === 0 ||
    !assistantSettingsInputs ||
    assistantSettingsInputs.length === 0
  ) {
    return null;
  }

  const handleAssistantClick = (assistant: any) => {
    setSelectedAssistant(assistant);
    // clear();
  };

  const handleEditAssistant = async (assistant: Assistant) => {
    console.log('assistant', assistant);
    if (assistant.settings_values['icon'] == null) {
      setEditAssistant(assistant);
    } else {
      const new_assistant_icon = apiClient.buildEndpoint(
        `${assistant.settings_values['icon']}`
      );
      const new_assistant = {
        ...assistant,
        settings_values: {
          ...assistant.settings_values,
          icon: new_assistant_icon
        }
      };
      setEditAssistant(new_assistant);
    }
    setNewAssistantOpen(true);
  };

  const handleCloseModal = () => {
    setNewAssistantOpen(false);
  };

  const displayedAssistants = showAll ? assistants : assistants.slice(0, 5);

  return (
    <Box>
      <List>
        {displayedAssistants.map((assistant: Assistant) => (
          <ListItem
            key={assistant.settings_values['name']}
            disablePadding
            sx={{ mb: 1 }}
          >
            <ListItemButton
              onClick={() => handleAssistantClick(assistant)}
              sx={{
                borderRadius: '12px',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: '36px' }}>
                {assistant.settings_values['icon'] ? (
                  <img
                    src={apiClient.buildEndpoint(
                      `${assistant.settings_values['icon']}`
                    )}
                    alt={assistant.settings_values['name']}
                    style={{
                      borderRadius: '50%',
                      width: '30px',
                      height: '30px'
                    }}
                  />
                ) : (
                  <UserIcon
                    sx={{
                      width: '30px',
                      height: '30px',
                      color: 'text.secondary'
                    }}
                  />
                )}
              </ListItemIcon>
              <ListItemText primary={assistant.settings_values['name']} />
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditAssistant(assistant);
                }}
              >
                <SettingsIcon />
              </IconButton>
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
        startValues={editAssistant ? editAssistant.settings_values : {}}
      />
    </Box>
  );
}
