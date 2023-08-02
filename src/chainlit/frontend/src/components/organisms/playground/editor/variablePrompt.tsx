import { ContentState, Editor, EditorState } from 'draft-js';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';

import { Box, Modal, Typography, useTheme } from '@mui/material';
import { grey } from '@mui/material/colors';

import RegularButton from 'components/atoms/buttons/button';

import { playgroundState } from 'state/playground';

import EditorWrapper from './editorWrapper';

const VariablePrompt = (): JSX.Element => {
  const [state, setState] = useState<EditorState | undefined>();
  const [playground, setPlayground] = useRecoilState(playgroundState);
  const theme = useTheme();

  useEffect(() => {
    if (
      playground.prompt &&
      playground.variableName &&
      playground.prompt.inputs
    ) {
      setState(
        EditorState.createWithContent(
          ContentState.createFromText(
            playground.prompt.inputs[playground.variableName]
          )
        )
      );
    }
  }, [playground?.variableName]);

  const updateVariable = () => {
    const variableName = playground?.variableName;

    if (variableName) {
      setPlayground((old) => {
        if (!old?.prompt) return old;

        return {
          ...old,
          variableName: undefined,
          prompt: {
            ...old.prompt,
            inputs: {
              ...old?.prompt?.inputs,
              [variableName]: state?.getCurrentContent().getPlainText() || ''
            }
          }
        };
      });
    }
  };

  const resetVariableName = () => {
    setPlayground((old) => ({
      ...old,
      variableName: undefined
    }));
  };

  return (
    <Modal open={!!playground?.variableName} onClose={resetVariableName}>
      <Box
        sx={{
          minWidth: '300px',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          border: `1px solid ${grey[800]}`,
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
          <EditorWrapper title="Question">
            <Editor
              customStyleFn={() => ({
                color: theme.palette.text.primary
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
          <RegularButton
            onClick={updateVariable}
            variant="outlined"
            color="inherit"
          >
            Edit
          </RegularButton>
        </Box>
      </Box>
    </Modal>
  );
};

export default VariablePrompt;
