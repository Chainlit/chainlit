import { ContentState, Editor, EditorState } from 'draft-js';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';

import { Box, Modal, Typography, useTheme } from '@mui/material';
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
    <Modal
      id="variable-modal"
      open={!!variableName}
      onClose={resetVariableName}
    >
      <Box
        sx={{
          minWidth: '400px',
          maxHeight: '80%',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          justifyContent: 'space-between',
          display: 'flex',
          flexDirection: 'column',
          border: (theme) =>
            theme.palette.mode === 'dark' ? `1px solid ${grey[800]}` : null,
          borderRadius: 1,
          padding: 2
        }}
      >
        <Typography
          fontSize="16px"
          fontWeight={700}
          color="text.secondary"
          pb={2}
        >
          Edit variable
        </Typography>
        {state ? (
          <EditorWrapper
            title="Question"
            sx={{ minHeight: '150px' }}
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
        <Box
          sx={{
            justifyContent: 'flex-end',
            display: 'flex',
            width: '100%',
            paddingTop: 2
          }}
        >
          <AccentButton
            id="edit-variable"
            onClick={updateVariable}
            variant="outlined"
          >
            Edit
          </AccentButton>
        </Box>
      </Box>
    </Modal>
  );
};

export default VariableModal;
