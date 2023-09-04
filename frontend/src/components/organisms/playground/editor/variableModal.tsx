import { ContentState, Editor, EditorState } from 'draft-js';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';

import {
  Alert,
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

import EditorWrapper from './EditorWrapper';

const VariableModal = (): JSX.Element | null => {
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

  if (!variableName) return null;

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
            {`Edit ${variableName}`}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert sx={{ my: 1 }} severity="info">
            Editing a variable will update its value in the formatted view. If
            you want to update the template instead, go to the template view.
          </Alert>
          {state ? (
            <EditorWrapper
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
        <DialogActions sx={{ padding: theme.spacing(0, 3, 2) }}>
          <AccentButton
            id="edit-variable"
            onClick={updateVariable}
            variant="outlined"
          >
            Save
          </AccentButton>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default VariableModal;
