import {
  ContentState,
  Editor,
  EditorState,
  Modifier,
  SelectionState
} from 'draft-js';
import { useColors } from 'helpers/color';
import { OrderedSet } from 'immutable';
import { useEffect, useState } from 'react';
import { useSetRecoilState } from 'recoil';

import EditorWrapper from 'components/organisms/playground/editor/editorWrapper';

import { playgroundState } from 'state/playground';

import 'draft-js/dist/Draft.css';

export interface IHighlight {
  name: string;
  placeholder: string;
  styleIndex: number;
  content?: string;
}

interface Props {
  template: string;
  highlights: IHighlight[];
  readOnly?: boolean;
  onChange?: (state: EditorState) => void;
}

function useCustomStyleMap() {
  const colors = useColors(true);

  const customStyleMap: Record<string, Record<string, string>> = {};

  for (let i = 0; i < colors.length; i++) {
    customStyleMap[i.toString()] = {
      background: colors[i],
      cursor: 'pointer'
    };
  }

  return customStyleMap;
}

function matchVariable(text: string, placeholder: string) {
  const regex = new RegExp(`(?<!\\{)${placeholder}(?!\\})`, 'g');
  const indices: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    indices.push(match.index);
  }

  return indices.length ? indices : [-1];
}

function highlight(state: EditorState, highlights: IHighlight[]) {
  let contentState = state.getCurrentContent();
  let nextState = state;

  // Highlight if condition is met
  for (const highlight of highlights) {
    contentState = nextState.getCurrentContent();

    contentState.getBlockMap().forEach((contentBlock) => {
      if (!contentBlock) {
        return;
      }

      const key = contentBlock.getKey();
      const text = contentBlock.getText();

      // Add style if condition is met
      const startIndices = matchVariable(text, highlight.placeholder);

      startIndices.forEach((startIndex) => {
        if (startIndex === -1) {
          return;
        }
        const currentSelection = nextState.getSelection();

        const end = startIndex + highlight.placeholder.length;
        const selectionToHighlight = new SelectionState({
          anchorKey: key,
          anchorOffset: startIndex,
          focusKey: key,
          focusOffset: end
        });

        contentState = nextState.getCurrentContent();

        contentState = contentState.createEntity(
          'TOKEN',
          'SEGMENTED',
          highlight
        );
        const entityKey = contentState.getLastCreatedEntityKey();

        contentState = Modifier.replaceText(
          contentState,
          selectionToHighlight,
          highlight.content || highlight.placeholder,
          OrderedSet.of(highlight.styleIndex.toString()),
          entityKey
        );

        nextState = EditorState.push(nextState, contentState, 'apply-entity');
        nextState = EditorState.forceSelection(nextState, currentSelection);
      });
    });
  }

  return nextState;
}

function getEntityAtSelection(editorState: EditorState) {
  const selectionState = editorState.getSelection();
  const selectionKey = selectionState.getStartKey();
  const contentstate = editorState.getCurrentContent();

  // The block in which the selection starts
  const block = contentstate.getBlockForKey(selectionKey);

  // Entity key at the start selection
  const entityKey = block.getEntityAt(selectionState.getStartOffset());

  if (entityKey) {
    // The actual entity instance
    const entityInstance = contentstate.getEntity(entityKey);
    const entityInfo = {
      type: entityInstance.getType(),
      mutability: entityInstance.getMutability(),
      data: entityInstance.getData()
    };
    return entityInfo;
  }
}

export default function FormattedPromptEditor({
  template,
  highlights,
  readOnly
}: Props) {
  const setPlayground = useSetRecoilState(playgroundState);

  const [state, setState] = useState<EditorState | undefined>();
  const [_readOnly, setReadOnly] = useState(false);

  const customStyleMap = useCustomStyleMap();

  useEffect(() => {
    const state = EditorState.createWithContent(
      ContentState.createFromText(template)
    );
    const nextState = highlight(state, highlights);

    setState(nextState);
  }, [highlights, template]);

  const handleOnEditorChange = (state: EditorState) => {
    const formatted = state?.getCurrentContent().getPlainText();
    setPlayground((old) => ({
      ...old,
      prompt: {
        ...old.prompt!,
        formatted
      }
    }));

    const entity = getEntityAtSelection(state);
    if (entity) {
      setPlayground((old) => ({
        ...old,
        variableName: entity.data.name
      }));
    }

    if (readOnly) {
      setReadOnly(true);
      setTimeout(() => setReadOnly(false), 100);
    }
  };

  if (!state) {
    return null;
  }

  return (
    <EditorWrapper title="Formatted">
      <Editor
        readOnly={_readOnly}
        customStyleMap={customStyleMap}
        editorState={state}
        onChange={handleOnEditorChange}
      />
    </EditorWrapper>
  );
}
