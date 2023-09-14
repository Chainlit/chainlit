import { useEffect, useRef, useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
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

import { IPrompt } from '@chainlit/components';

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

interface Props {
  prompt: IPrompt;
}

function _PromptPlayground({ prompt }: Props) {
  const setPlayground = useSetRecoilState(playgroundState);

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
    if (!prompt) return;
    mutate();
  }, [prompt]);

  useEffect(() => {
    if (!data) return;
    setPlayground((old) => ({ ...old, providers: data.providers }));
  }, [data]);

  const restore = () => {
    if (prompt) {
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

  const hasTemplate = prompt?.messages
    ? prompt.messages.every((m) => typeof m.template === 'string')
    : typeof prompt?.template === 'string';

  if (!data || error) {
    return null;
  }

  return (
    <Dialog
      open={!!prompt}
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
                prompt={prompt}
              />
              <ChatPromptPlayground
                ref={chatPromptScrollRef}
                restoredTime={restoredTime}
                hasTemplate={hasTemplate}
                prompt={prompt}
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

export default function PromptPlayground() {
  const playground = useRecoilValue(playgroundState);
  if (!playground?.prompt) {
    return null;
  }
  return <_PromptPlayground prompt={playground.prompt} />;
}
