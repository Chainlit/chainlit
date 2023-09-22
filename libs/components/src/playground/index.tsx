import { PlaygroundContext } from 'contexts/PlaygroundContext';
import { useContext, useRef, useState } from 'react';
import { ErrorBoundary } from 'src/ErrorBoundary';
import { useToggle } from 'usehooks-ts';

import RestoreIcon from '@mui/icons-material/Restore';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { IPlayground } from 'src/types/playground';
import { IPlaygroundContext } from 'src/types/playgroundContext';

import ActionBar from './actionBar';
import BasicPromptPlayground from './basic';
import ChatPromptPlayground from './chat';
import VariableModal from './editor/variableModal';
import PlaygroundHeader from './header';
import ModelSettings from './modelSettings';
import SubmitButton from './submitButton';

interface Props {
  context: IPlaygroundContext;
}

function _PromptPlayground() {
  const { playground, setPlayground, promptMode, setPromptMode } =
    useContext(PlaygroundContext);
  const [restoredTime, setRestoredTime] = useState(0);
  const [isDrawerOpen, toggleDrawer] = useToggle(false);
  const chatPromptScrollRef = useRef<HTMLDivElement | null>(null);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const showToggleDrawerButton = isSmallScreen && !!playground?.providers;

  const restore = () => {
    if (playground?.prompt) {
      setPlayground((old?: IPlayground) => ({
        ...old,
        prompt: old?.originalPrompt
      }));
      setRestoredTime((old) => old + 1);
    }
  };

  const handleClose = () => {
    setPlayground((old) => ({
      ...old,
      prompt: undefined,
      originalPrompt: undefined
    }));
  };

  const prompt = playground?.prompt;

  if (!prompt) {
    return null;
  }

  const hasTemplate = prompt?.messages
    ? !!prompt.messages.find((m) => typeof m.template === 'string')
    : typeof prompt?.template === 'string';

  if (!hasTemplate && promptMode === 'Template') {
    setPromptMode('Formatted');
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
          showToggleDrawerButton={showToggleDrawerButton}
          toggleDrawer={toggleDrawer}
          handleClose={handleClose}
        />
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', direction: 'row', padding: 3 }}>
        <ErrorBoundary prefix="Prompt Playground error">
          <Stack gap={3} width="100%">
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

const PromptPlayground = ({ context }: Props) => {
  return (
    <PlaygroundContext.Provider value={context}>
      <_PromptPlayground />
    </PlaygroundContext.Provider>
  );
};

export { PromptPlayground };
