import { useEffect, useRef, useState } from 'react';
import { useRecoilState } from 'recoil';
import { useToggle } from 'usehooks-ts';

import RestoreIcon from '@mui/icons-material/Restore';
import {
  Alert,
  IconButton,
  Stack,
  Theme,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import ErrorBoundary from 'components/atoms/errorBoundary';

import { useApi } from 'hooks/useApi';

import { playgroundState } from 'state/playground';

import { IPlayground } from 'types/playground';

import ActionBar from './actionBar';
import BasicPromptPlayground from './basic';
import ChatPromptPlayground from './chat';
import VariableModal from './editor/variableModal';
import PlaygroundHeader from './header';
import ModelSettings from './modelSettings';
import SubmitButton from './submitButton';

export default function PromptPlayground() {
  const [playground, setPlayground] = useRecoilState(playgroundState);

  const { data, error, mutate } = useApi<IPlayground>('/project/llm-providers');

  const [restoredTime, setRestoredTime] = useState(0);
  const [isDrawerOpen, toggleDrawer] = useToggle(false);
  const chatPromptScrollRef = useRef<HTMLDivElement | null>(null);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery<Theme>((theme) =>
    theme.breakpoints.down('md')
  );

  useEffect(() => {
    // Refresh the providers when the playground is opened
    if (!playground?.prompt) return;
    mutate();
  }, [playground?.prompt]);

  useEffect(() => {
    if (!data) return;
    setPlayground((old) => ({ ...old, providers: data.providers }));
  }, [data]);

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

  // Only render the playground if it's open and we have providers.
  // Prevents the "no provider" error from being thrown and a playground flash
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
        <PlaygroundHeader
          hasTemplate={hasTemplate}
          isSmallScreen={isSmallScreen}
          toggleDrawer={toggleDrawer}
          handleClose={handleClose}
        />
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', direction: 'row', padding: 3 }}>
        <ErrorBoundary prefix="Prompt Playground error">
          <Stack gap={3} width="100%">
            {error ? (
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
                ref={chatPromptScrollRef}
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
        <SubmitButton
          onSubmit={() => {
            if (!chatPromptScrollRef?.current) return;

            chatPromptScrollRef.current.scrollTop =
              chatPromptScrollRef.current.scrollHeight;
          }}
        />
      </ActionBar>
    </Dialog>
  );
}
