import { Editor, EditorState, Modifier, SelectionState } from 'draft-js';
import { OrderedSet } from 'immutable';
import { useEffect, useState } from 'react';
import EditorWrapper from 'src/playground/editor/EditorWrapper';
import { grey } from 'theme';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';

import 'draft-js/dist/Draft.css';

import MessageWrapper from './MessageWrapper';

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
      sxChildren={{
        borderColor: (theme) => theme.palette.success.main,
        '&:hover': {
          borderColor: (theme) => theme.palette.success.main
        }
      }}
    >
      <Editor
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
    <MessageWrapper role="ASSISTANT">{renderEditor()}</MessageWrapper>
  );
}
