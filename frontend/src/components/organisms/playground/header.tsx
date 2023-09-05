import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';
import { IconButton, Stack } from '@mui/material';

import { grey } from '@chainlit/components/theme';

import AccentButton from 'components/atoms/buttons/accentButton';

import PromptModeToggle from './modeToggle';
import SaveButton from './saveButton';
import VariableInput from './variableInput';

interface Props {
  hasTemplate?: boolean;
  isSmallScreen?: boolean;
  toggleDrawer: () => void;
  handleClose: () => void;
}

export default function PlaygroundHeader({
  hasTemplate,
  isSmallScreen,
  toggleDrawer,
  handleClose
}: Props) {
  return (
    <Stack direction="row" alignItems="center">
      <Stack direction="row" alignItems="center" gap={1}>
        <PromptModeToggle hasTemplate={hasTemplate} />
        <VariableInput />
      </Stack>
      <Stack sx={{ ml: 'auto' }} direction="row" alignItems="center" gap={1}>
        <AccentButton
          size="large"
          target="_blank"
          href="https://docs.chainlit.io/concepts/prompt-playground"
        >
          Help
        </AccentButton>
        <SaveButton hasTemplate={hasTemplate} />

        {isSmallScreen ? (
          <IconButton
            aria-label="open drawer"
            edge="end"
            onClick={toggleDrawer}
            sx={{ mr: '4px' }}
          >
            <TuneIcon />
          </IconButton>
        ) : null}
        <IconButton edge="end" id="close-playground" onClick={handleClose}>
          <CloseIcon sx={{ height: '32px', width: '32px', color: grey[500] }} />
        </IconButton>
      </Stack>
    </Stack>
  );
}
