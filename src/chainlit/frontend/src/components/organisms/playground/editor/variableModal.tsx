import { ContentState, Editor, EditorState } from 'draft-js';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';

import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme
} from '@mui/material';
import { grey } from '@mui/material/colors';

import AccentButton from 'components/atoms/buttons/accentButton';

import { playgroundState, variableState } from 'state/playground';

import EditorWrapper from './wrapper';

const VariableModal = (): JSX.Element => {
  const [state, setState] = useState<EditorState | undefined>();
  const [playground, setPlayground] = useRecoilState(playgroundState);
  const [variableName, setVariableName] = useRecoilState(variableState);
  const theme = useTheme();

  useEffect(() => {
    if (variableName && playground.prompt?.inputs) {
      setState(
        EditorState.createWithContent(
          ContentState.createFromText(playground.prompt.inputs[variableName])
        )
      );
    }
  }, [variableName]);

  const updateVariable = () => {
    if (variableName) {
      setPlayground((old) => {
        if (!old?.prompt) return old;

        return {
          ...old,
          prompt: {
            ...old.prompt,
            inputs: {
              ...old?.prompt?.inputs,
              [variableName]: state?.getCurrentContent().getPlainText() || ''
            }
          }
        };
      });
      setVariableName(undefined);
    }
  };

  const resetVariableName = () => {
    setVariableName(undefined);
  };

  return (
    <Dialog
      id="variable-modal"
      open={!!variableName}
      onClose={resetVariableName}
      fullWidth
      maxWidth="md"
      sx={{
        border: (theme) =>
          theme.palette.mode === 'dark' ? `1px solid ${grey[800]}` : null,
        borderRadius: 1
      }}
    >
      <Box bgcolor="background.paper">
        <DialogTitle>
          <Typography fontSize="16px" fontWeight={700} color="text.secondary">
            Edit variable
          </Typography>
        </DialogTitle>
        <DialogContent>
          {state ? (
            <EditorWrapper
              title={variableName}
              sx={{ minHeight: '250px' }}
              sxChildren={{ padding: 1 }}
            >
              <Editor
                customStyleFn={() => ({
                  color: theme.palette.text.primary,
                  padding: '2px'
                })}
                editorState={state}
                onChange={(nextState) => {
                  nextState && setState(nextState);
                }}
              />
            </EditorWrapper>
          ) : null}
        </DialogContent>
        <DialogActions>
          <AccentButton
            id="edit-variable"
            onClick={updateVariable}
            variant="outlined"
          >
            Edit
          </AccentButton>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default VariableModal;
