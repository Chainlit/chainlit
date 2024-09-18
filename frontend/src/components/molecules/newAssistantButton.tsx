import { useRecoilState } from 'recoil';

import { Box, Button, ButtonProps, Tooltip } from '@mui/material';

import { Translator } from 'components/i18n';
import AssistantCreationModal from 'components/organisms/chat/newAssistant';

import SquarePlusIcon from 'assets/squarePlus';

import { newAssistantOpenState } from 'state/project';
import { useChatData } from '@chainlit/react-client';

export default function NewAssistantButton(props: ButtonProps) {
  const [newAssistantOpen, setNewAssistantOpen] = useRecoilState(
    newAssistantOpenState
  );
  const { assistantSettingsInputs } = useChatData();

  const handleClickOpen = () => {
    setNewAssistantOpen(true);
  };

  const handleClose = () => {
    setNewAssistantOpen(false);
  };

  if (!assistantSettingsInputs || assistantSettingsInputs.length === 0) {
    return null;
  }

  return (
    <Box>
      <Tooltip
        title={
          <Translator path="components.molecules.newAssistantButton.newAssistant" />
        }
      >
        <Button
          id="new-assistant-button"
          onClick={handleClickOpen}
          startIcon={<SquarePlusIcon />}
          sx={{
            justifyContent: 'flex-start',
            textTransform: 'none',
            width: '100%',
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
          {...props}
        >
          New Assistant
        </Button>
      </Tooltip>
      <AssistantCreationModal
        open={newAssistantOpen}
        handleClose={handleClose}
        startValues={{}}  // Add this line
      />
    </Box>
  );
}