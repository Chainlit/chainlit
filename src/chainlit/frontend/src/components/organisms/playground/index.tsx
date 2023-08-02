import { preparePrompt } from 'helpers/format';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useIsFirstRender, useToggle } from 'usehooks-ts';

import { Check } from '@mui/icons-material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/HelpOutline';
import RestoreIcon from '@mui/icons-material/Restore';
import SettingsIcon from '@mui/icons-material/Settings';
import LoadingButton from '@mui/lab/LoadingButton';
import {
  Alert,
  Box,
  Drawer,
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
import { playgroundState } from 'state/playground';
import { userEnvState } from 'state/user';

import Completion from './editor/completion';
import FormattedPrompt from './editor/formatted';
import TemplatePrompt from './editor/template';
import VariablePrompt from './editor/variablePrompt';
import ModelSettings from './modelSettings';

export default function Playground() {
  const client = useRecoilValue(clientState);
  const [playground, setPlayground] = useRecoilState(playgroundState);
  const userEnv = useRecoilValue(userEnvState);

  const [loading, setLoading] = useState(false);
  const [toggle, setToggle] = useState('Template');
  const [providersError, setProvidersError] = useState();

  const [isDrawerOpen, toggleDrawer] = useToggle(false);
  const isFirstRender = useIsFirstRender();

  if (isFirstRender) {
    client
      .getLLMProviders()
      .then((res) =>
        setPlayground((old) => ({ ...old, providers: res.providers }))
      )
      .catch((err) => setProvidersError(err));
  }

  const isSmallScreen = !useMediaQuery<Theme>((theme) =>
    theme.breakpoints.up('sm')
  );

  const theme = useTheme();

  const restore = () => {
    if (playground) {
      setPlayground(playground);
    }
  };

  const handleClose = () => {
    setPlayground((old) => ({ ...old, prompt: undefined }));
  };

  const submit = async () => {
    try {
      const prompt = preparePrompt(playground.prompt);
      setLoading(true);
      const completion = await client.getCompletion(prompt, userEnv);
      setPlayground((old) => {
        if (!old?.prompt) return old;

        return {
          ...old,
          prompt: { ...old.prompt!, completion }
        };
      });
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderModalSettings = () => <ModelSettings />;

  if (!playground?.prompt) {
    return null;
  }

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
        <Toggle
          value={toggle}
          items={['Template', 'Formatted']}
          onChange={setToggle}
        />
        <Box sx={{ ml: 'auto' }}>
          {isSmallScreen ? (
            <IconButton
              aria-label="open drawer"
              edge="end"
              onClick={toggleDrawer}
              sx={{ mr: '4px' }}
            >
              <SettingsIcon />
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
          {toggle === 'Template' ? (
            <TemplatePrompt prompt={playground.prompt} />
          ) : null}
          {toggle === 'Formatted' ? (
            <FormattedPrompt prompt={playground.prompt} />
          ) : null}
          <Completion completion={playground.prompt.completion} />
          <VariablePrompt />
          {!isSmallScreen ? (
            renderModalSettings()
          ) : (
            <Drawer
              sx={{
                '& .MuiDrawer-paper': {
                  alignItems: 'center',
                  width: '300px'
                }
              }}
              variant="persistent"
              anchor="right"
              open={isDrawerOpen}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  width: '100%',
                  paddingRight: '30px',
                  paddingTop: '10px'
                }}
              >
                <IconButton onClick={toggleDrawer}>
                  <ChevronRightIcon />
                </IconButton>
              </Box>
              {renderModalSettings()}
            </Drawer>
          )}
        </Stack>
      </DialogContent>
      <Stack
        direction="row"
        sx={{
          backgroundColor: (theme) => theme.palette.background.paper,
          padding: '16px 24px',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 2
        }}
      >
        <Tooltip title="Restore original">
          <IconButton onClick={restore}>
            <RestoreIcon />
          </IconButton>
        </Tooltip>
        <LoadingButton
          onClick={submit}
          variant="outlined"
          sx={{
            padding: '8px 12px',
            '& .MuiButton-startIcon': {
              marginRight: '4px'
            }
          }}
          loading={loading}
          startIcon={<Check />}
          color="inherit"
        >
          Submit
        </LoadingButton>
      </Stack>
    </Dialog>
  );
}
