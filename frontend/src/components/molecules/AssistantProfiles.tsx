import { useCallback, useContext, useEffect, useState } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';

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
  useAuth,
  useChatData,
  useChatInteract
} from '@chainlit/react-client';

import AssistantCreationModal from 'components/organisms/chat/newAssistant';

import UserIcon from 'assets/user';

import { Assistant, assistantsState } from 'state/project';
import { selectedAssistantState } from 'state/project';

export default function AssistantProfiles() {
  const apiClient = useContext(ChainlitContext);
  const { listAssistants, setSelectedAssistant } = useChatInteract();
  const [assistants, setAssistants] = useRecoilState(assistantsState);
  const { assistantSettingsInputs } = useChatData();
  const { resetMessages } = useChatInteract();
  const [showAll, setShowAll] = useState(false);
  const [newAssistantOpen, setNewAssistantOpen] = useState<boolean>(false);
  const [editAssistant, setEditAssistant] = useState<any | null>(null);
  const SetFrontSelectedAssistant = useSetRecoilState(selectedAssistantState);
  const { user } = useAuth();

  const fetchAssistants = useCallback(async () => {
    if (assistantSettingsInputs && assistantSettingsInputs.length > 0) {
      try {
        setAssistants((await listAssistants()) as Assistant[]);
      } catch (error) {
        console.error('Error fetching assistants:', error);
        setAssistants([]);
      }
    }
  }, [listAssistants, setAssistants, assistantSettingsInputs]);

  useEffect(() => {
    fetchAssistants();
  }, [fetchAssistants]);

  useEffect(() => {
    if (assistants.length > 0) {
      setSelectedAssistant(assistants[0]);
      SetFrontSelectedAssistant(assistants[0]);
    }
  }, [assistants, setSelectedAssistant, SetFrontSelectedAssistant]);

  if (
    !assistantSettingsInputs ||
    assistantSettingsInputs.length === 0 ||
    !assistants ||
    assistants.length === 0
  ) {
    return null;
  }

  const handleAssistantClick = (assistant: Assistant) => {
    resetMessages();
    setSelectedAssistant(assistant);
    SetFrontSelectedAssistant(assistant);
  };

  const handleEditAssistant = async (assistant: Assistant) => {
    if (assistant.settings_values['created_by'] !== user?.identifier) {
      return; // Don't allow editing if the user is not the creator
    }

    if (assistant.settings_values['icon'] == null) {
      setEditAssistant(assistant);
    } else {
      let icon = assistant.settings_values['icon'];
      if (icon.startsWith('/')) {
        icon = apiClient.buildEndpoint(icon);
      }
      const new_assistant = {
        ...assistant,
        settings_values: {
          ...assistant.settings_values,
          icon: icon
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
                    src={
                      assistant.settings_values['icon'].startsWith('/')
                        ? apiClient.buildEndpoint(
                            assistant.settings_values['icon']
                          )
                        : assistant.settings_values['icon']
                    }
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
              {assistant.settings_values['created_by'] === user?.identifier && (
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditAssistant(assistant);
                  }}
                >
                  <SettingsIcon />
                </IconButton>
              )}
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
