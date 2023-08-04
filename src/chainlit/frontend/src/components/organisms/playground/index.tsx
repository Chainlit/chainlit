import map from 'lodash/map';
import { useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useIsFirstRender, useToggle } from 'usehooks-ts';

import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/HelpOutline';
import RestoreIcon from '@mui/icons-material/Restore';
import TuneIcon from '@mui/icons-material/Tune';
import {
  Alert,
  Box,
  IconButton,
  Stack,
  Theme,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import Toggle from 'components/atoms/toggle';

import { clientState } from 'state/client';
import { playgroundState, variableState } from 'state/playground';

import SelectInput from '../inputs/selectInput';
import ActionBar from './actionBar';
import BasicPromptPlayground from './basic';
import ChatPromptPlayground from './chat';
import VariableModal from './editor/variableModal';
import ModelSettings from './modelSettings';
import SubmitButton from './submitButton';

export type PromptMode = 'Template' | 'Formatted';

export default function PromptPlayground() {
  const client = useRecoilValue(clientState);
  const [playground, setPlayground] = useRecoilState(playgroundState);
  const [variableName, setVariableName] = useRecoilState(variableState);

  const [restoredTime, setRestoredTime] = useState(0);
  const [providersError, setProvidersError] = useState();
  const [promptMode, setPromptMode] = useState<PromptMode>('Template');
  const [isDrawerOpen, toggleDrawer] = useToggle(false);

  const isFirstRender = useIsFirstRender();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery<Theme>((theme) =>
    theme.breakpoints.down('md')
  );

  if (isFirstRender) {
    client
      .getLLMProviders()
      .then((res) =>
        setPlayground((old) => ({ ...old, providers: res.providers }))
      )
      .catch((err) => setProvidersError(err));
  }

  const restore = () => {
    if (playground) {
      setPlayground((old) => ({
        ...old,
        prompt: old.originalPrompt
      }));
      setRestoredTime((old) => old + 1);
    }
  };

  const handleClose = () => {
    setPlayground((old) => ({ ...old, prompt: undefined }));
  };

  if (!playground?.prompt) {
    return null;
  }

  const hasTemplate = playground?.prompt?.messages
    ? playground.prompt.messages.every((m) => typeof m.template === 'string')
    : typeof playground?.prompt?.template === 'string';

  const variables = map(playground.prompt.inputs, (input, index) => ({
    label: index,
    value: index
  }));

  return (
    <Dialog
      open={!!playground.prompt}
      fullScreen
      PaperProps={{
        style: {
          backgroundColor: theme.palette.background.default,
          backgroundImage: 'none'
        }
      }}
      onClose={handleClose}
      id="playground"
      aria-labelledby="playground"
      aria-describedby="playground"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography fontSize="18px" fontWeight={700}>
          Prompt playground
        </Typography>
        <IconButton
          href="https://docs.chainlit.io/concepts/prompt-playground"
          target="_blank"
        >
          <Tooltip title="Help">
            <HelpIcon />
          </Tooltip>
        </IconButton>
        {hasTemplate ? (
          <Toggle
            value={promptMode}
            items={['Template', 'Formatted']}
            onChange={(v) => setPromptMode(v as PromptMode)}
          />
        ) : (
          <Alert severity="warning" id="template-warning">
            Prompt template not found. Only displaying formatted prompt instead.
          </Alert>
        )}
        <SelectInput
          items={variables}
          id="variable-select"
          value={variableName || ''}
          label="Variable name"
          placeholder="Select a variable"
          onChange={(e) => setVariableName(e.target.value)}
          sx={{ maxWidth: '270px' }}
        />
        <Box sx={{ ml: 'auto' }}>
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
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      {providersError ? (
        <Alert severity="error">
          An error occurred while fetching providers settings
        </Alert>
      ) : null}
      <DialogContent sx={{ display: 'flex', flexDirection: 'column' }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            overflowY: 'auto',
            paddingBottom: 2,
            height: '100%'
          }}
        >
          <VariableModal />
          <BasicPromptPlayground
            restoredTime={restoredTime}
            hasTemplate={hasTemplate}
            prompt={playground.prompt}
            mode={hasTemplate ? promptMode : 'Formatted'}
          />
          <ChatPromptPlayground
            restoredTime={restoredTime}
            hasTemplate={hasTemplate}
            prompt={playground.prompt}
            mode={hasTemplate ? promptMode : 'Formatted'}
          />
          <ModelSettings
            isSmallScreen={isSmallScreen}
            isDrawerOpen={isDrawerOpen}
            toggleDrawer={toggleDrawer}
          />
        </Stack>
      </DialogContent>
      <ActionBar>
        <Tooltip title="Restore original">
          <IconButton onClick={restore}>
            <RestoreIcon />
          </IconButton>
        </Tooltip>
        <SubmitButton />
      </ActionBar>
    </Dialog>
  );
}
