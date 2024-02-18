import { PlaygroundContext } from 'contexts/PlaygroundContext';
import { useContext, useRef, useState } from 'react';
import { ErrorBoundary } from 'src/ErrorBoundary';
import { useToggle } from 'usehooks-ts';

import RestoreIcon from '@mui/icons-material/Restore';
import { Chip } from '@mui/material';
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
import FunctionModal from './editor/functionModal';
import VariableModal from './editor/variableModal';
import PlaygroundHeader from './header';
import ModelSettings from './modelSettings';
import SubmitButton from './submitButton';

interface Props {
  context: IPlaygroundContext;
}

function _PromptPlayground() {
  const { playground, setPlayground } = useContext(PlaygroundContext);
  const [restoredTime, setRestoredTime] = useState(0);
  const [isDrawerOpen, toggleDrawer] = useToggle(false);
  const chatPromptScrollRef = useRef<HTMLDivElement | null>(null);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const showToggleDrawerButton = isSmallScreen && !!playground?.providers;

  const restore = () => {
    if (playground?.generation) {
      setPlayground((old?: IPlayground) => ({
        ...old,
        generation: old?.originalGeneration
      }));
      setRestoredTime((old) => old + 1);
    }
  };

  const handleClose = () => {
    setPlayground((old) => ({
      ...old,
      generation: undefined,
      originalGeneration: undefined
    }));
  };

  const generation = playground?.generation;

  const isChat = generation?.type === 'CHAT';

  const hasTemplate = false;

  if (!generation) {
    return null;
  }

  return (
    <Dialog
      open={!!generation}
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
              <FunctionModal />
              <VariableModal />
              {isChat ? (
                <ChatPromptPlayground
                  ref={chatPromptScrollRef}
                  restoredTime={restoredTime}
                  hasTemplate={hasTemplate}
                  generation={generation}
                />
              ) : (
                <BasicPromptPlayground
                  restoredTime={restoredTime}
                  hasTemplate={hasTemplate}
                  generation={generation}
                />
              )}
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
        {generation.tokenCount ? (
          <Chip label={`${generation.tokenCount} tokens`} />
        ) : null}
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
