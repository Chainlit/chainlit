import { PlaygroundContext } from 'contexts/PlaygroundContext';
import { ContentState, Editor, EditorState } from 'draft-js';
import { useContext, useEffect, useState } from 'react';
import { AccentButton } from 'src/buttons';
import { grey } from 'theme';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import EditorWrapper from './EditorWrapper';

const VariableModal = (): JSX.Element | null => {
  const [state, setState] = useState<EditorState | undefined>();
  const { setPlayground, playground, variableName, setVariableName } =
    useContext(PlaygroundContext);

  const theme = useTheme();

  useEffect(() => {
    if (variableName && playground?.generation?.inputs) {
      setState(
        EditorState.createWithContent(
          ContentState.createFromText(
            playground.generation.inputs[variableName]
          )
        )
      );
    }
  }, [variableName]);

  const updateVariable = () => {
    if (variableName) {
      setPlayground((old) => {
        if (!old?.generation) return old;

        return {
          ...old,
          generation: {
            ...old.generation,
            inputs: {
              ...old?.generation?.inputs,
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
