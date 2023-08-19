import { grey } from 'palette';
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

import ErrorBoundary from 'components/atoms/errorBoundary';

import { clientState } from 'state/client';
import { playgroundState } from 'state/playground';

import ActionBar from './actionBar';
import BasicPromptPlayground from './basic';
import ChatPromptPlayground from './chat';
import VariableModal from './editor/variableModal';
import PlaygroundHeader from './header';
import ModelSettings from './modelSettings';
import SubmitButton from './submitButton';

export default function PromptPlayground() {
  const client = useRecoilValue(clientState);
  const [playground, setPlayground] = useRecoilState(playgroundState);

  const [restoredTime, setRestoredTime] = useState(0);
  const [providersError, setProvidersError] = useState();
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
      <DialogTitle sx={{ display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" alignItems="center">
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
              <CloseIcon
                sx={{ height: '32px', width: '32px', color: grey[500] }}
              />
            </IconButton>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', direction: 'row', padding: 3 }}>
        <ErrorBoundary prefix="Prompt Playground error">
          <Stack gap={3} width="100%">
            <PlaygroundHeader hasTemplate={hasTemplate} />
            {providersError ? (
              <Alert severity="error">
                An error occurred while fetching providers settings
              </Alert>
            ) : null}
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
              />
              <ChatPromptPlayground
                restoredTime={restoredTime}
                hasTemplate={hasTemplate}
                prompt={playground.prompt}
              />
            </Stack>
          </Stack>
          <ModelSettings
            isSmallScreen={isSmallScreen}
            isDrawerOpen={isDrawerOpen}
            toggleDrawer={toggleDrawer}
          />
        </ErrorBoundary>
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
