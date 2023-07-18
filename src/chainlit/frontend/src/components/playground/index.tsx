import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useRecoilState, useRecoilValue } from 'recoil';

import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/HelpOutline';
import RestoreIcon from '@mui/icons-material/Restore';
import LoadingButton from '@mui/lab/LoadingButton';
import { IconButton, Stack, Tooltip, Typography } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import { clientState } from 'state/client';
import { playgroundState } from 'state/playground';
import { userEnvState } from 'state/user';

import Completion from './editor/completion';
import FormattedPrompt from './editor/formatted';
import TemplatePrompt from './editor/template';
import ModelSettings from './modelSettings';

export default function Playground() {
  const client = useRecoilValue(clientState);
  const [origPrompt, setOrigPrompt] = useRecoilState(playgroundState);

  const userEnv = useRecoilValue(userEnvState);
  const [loading, setLoading] = useState(false);

  const restore = () => {
    if (origPrompt) {
      setOrigPrompt({ ...origPrompt });
    }
  };

  const handleClose = () => {
    setOrigPrompt(undefined);
  };

  const submit = async () => {
    if (!origPrompt?.llm_settings || !origPrompt?.formatted) {
      return;
    }
    try {
      setLoading(true);
      const completion = await client.getCompletion(
        origPrompt.formatted,
        origPrompt.llm_settings,
        userEnv
      );
      setOrigPrompt((old) => ({ ...old, completion }));
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!origPrompt) {
    return null;
  }

  return (
    <Dialog
      open={!!origPrompt}
      fullScreen
      PaperProps={{
        style: {
          // backgroundColor: theme.palette.background.default,
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
        <IconButton
          edge="end"
          id="close-playground"
          sx={{ ml: 'auto' }}
          onClick={handleClose}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column' }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ overflowY: 'auto', overflowX: 'hidden', flexGrow: 1 }}
        >
          <TemplatePrompt prompt={origPrompt} />
          <FormattedPrompt prompt={origPrompt} />
          <Completion completion={origPrompt.completion} />
          <ModelSettings />
        </Stack>
        <Stack direction="row" alignItems="center" mt={1} spacing={2}>
          <LoadingButton
            onClick={submit}
            variant="contained"
            sx={{ padding: '6px 12px', height: '35px' }}
            loading={loading}
          >
            Submit
          </LoadingButton>
          <Tooltip title="Restore original">
            <IconButton onClick={restore}>
              <RestoreIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
