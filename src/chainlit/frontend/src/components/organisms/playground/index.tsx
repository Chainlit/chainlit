import {
  ContentState,
  Editor,
  EditorState,
  Modifier,
  SelectionState
} from 'draft-js';
import { OrderedSet } from 'immutable';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useToggle } from 'usehooks-ts';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/HelpOutline';
import RestoreIcon from '@mui/icons-material/Restore';
import SettingsIcon from '@mui/icons-material/Settings';
import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import { clientState } from 'state/client';
import { playgroundSettingsState, playgroundState } from 'state/playground';
import { userEnvState } from 'state/user';

import 'draft-js/dist/Draft.css';

import ModelSettings from './modelSettings';

const styleMap = {
  COMPLETION: {
    backgroundColor: '#d2f4d3',
    color: 'black'
  }
};

export default function Playground() {
  const client = useRecoilValue(clientState);
  const playground = useRecoilValue(playgroundState);
  const setPlayground = useSetRecoilState(playgroundState);
  const settings = useRecoilValue(playgroundSettingsState);
  const userEnv = useRecoilValue(userEnvState);
  const setPlaygroundSettings = useSetRecoilState(playgroundSettingsState);

  const [state, setState] = useState(EditorState.createEmpty());
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, toggleDrawer] = useToggle(false);

  useEffect(() => {
    if (playground?.prompt) {
      const _state = EditorState.createWithContent(
        ContentState.createFromText(playground.prompt)
      );
      setState(insertCompletion(_state, playground.completion));
    }
    if (playground?.llmSettings) {
      setPlaygroundSettings({ ...playground.llmSettings });
    }
  }, [playground]);

  const restore = () => {
    if (playground) {
      setPlayground({ ...playground });
    }
  };

  const insertCompletion = (state: EditorState, completion: string) => {
    const contentState = state.getCurrentContent();

    const blockMap = contentState.getBlockMap();
    const key = blockMap.last().getKey();
    const length = blockMap.last().getLength();
    const selection = new SelectionState({
      anchorKey: key,
      anchorOffset: length,
      focusKey: key,
      focusOffset: length
    });

    const ncs = Modifier.insertText(
      contentState,
      selection,
      '\n' + completion,
      OrderedSet.of('COMPLETION')
    );
    const es = EditorState.push(state, ncs, 'insert-characters');
    return EditorState.forceSelection(es, ncs.getSelectionAfter());
  };

  const handleClose = () => {
    setPlayground(undefined);
  };

  const submit = async () => {
    if (!settings) {
      return;
    }
    const prompt = state.getCurrentContent().getPlainText();
    try {
      setLoading(true);
      const completion = await client.getCompletion(prompt, settings, userEnv);
      setState(insertCompletion(state, completion));
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={!!playground}
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
        <Box sx={{ ml: 'auto' }}>
          <IconButton
            aria-label="open drawer"
            edge="end"
            onClick={toggleDrawer}
            sx={{ mr: '4px' }}
          >
            <SettingsIcon />
          </IconButton>
          <IconButton edge="end" id="close-playground" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack direction="row" alignItems="flex-start">
          <Box
            sx={{
              fontFamily: 'Inter',
              fontSize: '16px',
              lineHeight: '24px',
              padding: '0.75rem',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: '0.375rem',
              overflowY: 'auto',
              width: '100%',
              flexGrow: 1,
              caretColor: (theme) => theme.palette.text.primary,
              height: '80vh'
            }}
          >
            <Editor
              customStyleMap={styleMap}
              editorState={state}
              onChange={setState}
            />
          </Box>
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
            <ModelSettings />
          </Drawer>
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
