import { useRecoilState } from 'recoil';

import { Box, IconButton, IconButtonProps, Tooltip } from '@mui/material';

import { Translator } from 'components/i18n';
import AssistantCreationModal from 'components/organisms/chat/newAssistant';

import SquarePlusIcon from 'assets/squarePlus';

import { newAssistantOpenState } from 'state/project';
import { useChatData } from '@chainlit/react-client';

export default function NewAssistantButton(props: IconButtonProps) {
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
        <IconButton
          id="new-assistant-button"
          onClick={handleClickOpen}
          {...props}
        >
          <SquarePlusIcon />
        </IconButton>
      </Tooltip>
      <AssistantCreationModal
        open={newAssistantOpen}
        handleClose={handleClose}
      />
    </Box>
  );
}