import { Editor, EditorState, Modifier, SelectionState } from 'draft-js';
import { OrderedSet } from 'immutable';
import { useEffect, useState } from 'react';

import EditorWrapper from 'components/organisms/playground/editor/wrapper';

import 'draft-js/dist/Draft.css';

const styleMap = {
  COMPLETION: {
    backgroundColor: '#d2f4d3',
    color: 'black'
  }
};

interface Props {
  completion?: string;
}

export default function Completion({ completion }: Props) {
  const [state, setState] = useState(EditorState.createEmpty());

  useEffect(() => {
    let _state = EditorState.createEmpty();
    if (completion) {
      _state = insertCompletion(_state, completion);
    }

    setState(_state);
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

  return (
    <EditorWrapper title="Completion">
      <Editor
        readOnly
        customStyleMap={styleMap}
        editorState={state}
        onChange={setState}
      />
    </EditorWrapper>
  );
}
