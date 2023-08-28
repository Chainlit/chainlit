import { Editor, EditorState, Modifier, SelectionState } from 'draft-js';
import { OrderedSet } from 'immutable';
import { useEffect, useState } from 'react';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';

import EditorWrapper from 'components/organisms/playground/editor/wrapper';

import 'draft-js/dist/Draft.css';

const styleMap = {
  COMPLETION: {
    backgroundColor: '#d2f4d3',
    color: 'black',
    borderRadius: '2px'
  }
};

interface Props {
  completion?: string;
  chatMode?: boolean;
}

export default function Completion({ completion, chatMode }: Props) {
  const [state, setState] = useState(EditorState.createEmpty());
  const [isCompletionOpen, setCompletionOpen] = useState(true);

  useEffect(() => {
    let _state = EditorState.createEmpty();
    if (completion) {
      _state = insertCompletion(_state, completion);
    }

    setState(_state);
    setCompletionOpen(true);
  }, [completion]);

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
      completion,
      OrderedSet.of('COMPLETION')
    );
    const es = EditorState.push(state, ncs, 'insert-characters');
    return EditorState.forceSelection(es, ncs.getSelectionAfter());
  };

  const renderEditor = () => (
    <EditorWrapper
      className="completion-editor"
      clipboardValue={state.getCurrentContent().getPlainText()}
    >
      <Editor
        customStyleMap={styleMap}
        editorState={state}
        onChange={(nextState) => {
          // Read only mode, force content but preserve selection
          nextState = EditorState.push(
            nextState,
            state.getCurrentContent(),
            'insert-characters'
          );
          setState(nextState);
        }}
      />
    </EditorWrapper>
  );

  return !chatMode ? (
    <Box marginTop={2}>
      <Stack
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingRight: '6px'
        }}
      >
        <Typography fontSize="14px" fontWeight={700} color={grey[400]}>
          Completion
        </Typography>
        <IconButton onClick={() => setCompletionOpen(!isCompletionOpen)}>
          {isCompletionOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Stack>
      <Box
        sx={{
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          marginTop: 1
        }}
      />
      <Box
        sx={{
          maxHeight: isCompletionOpen ? '220px' : '0px',
          transition: 'max-height 0.5s ease-in-out',
          overflow: 'auto',
          marginTop: 2
        }}
      >
        {renderEditor()}
      </Box>
    </Box>
  ) : (
    <Box>
      <Box
        sx={{
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: 1
        }}
      />
      <Stack
        direction="row"
        width="100%"
        sx={{
          paddingY: 1,
          paddingRight: 0,
          '&:hover': {
            background: (theme) => theme.palette.background.paper
          }
        }}
      >
        <Typography
          color="text.primary"
          sx={{
            marginTop: 2,
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 700,
            paddingLeft: 3,
            paddingRight: 5
          }}
        >
          {'ASSISTANT'}
        </Typography>
        <Box width="100%">{renderEditor()}</Box>
      </Stack>
    </Box>
  );
}
