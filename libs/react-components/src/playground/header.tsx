import { AccentButton } from 'src/buttons';
import { grey } from 'theme';

import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';

import FunctionInput from './functionInput';
import PromptModeToggle from './modeToggle';
import VariableInput from './variableInput';

interface Props {
  hasTemplate?: boolean;
  showToggleDrawerButton?: boolean;
  toggleDrawer: () => void;
  handleClose: () => void;
}

export default function PlaygroundHeader({
  hasTemplate,
  showToggleDrawerButton,
  toggleDrawer,
  handleClose
}: Props) {
  return (
    <Stack direction="row" alignItems="center">
      <Stack direction="row" alignItems="center" gap={2}>
        <PromptModeToggle hasTemplate={hasTemplate} />
        <VariableInput />
        <FunctionInput />
      </Stack>
      <Stack sx={{ ml: 'auto' }} direction="row" alignItems="center" gap={1}>
        <AccentButton
          size="large"
          target="_blank"
          href="https://docs.chainlit.io/advanced-features/prompt-playground/overview"
        >
          Help
        </AccentButton>

        {showToggleDrawerButton ? (
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
