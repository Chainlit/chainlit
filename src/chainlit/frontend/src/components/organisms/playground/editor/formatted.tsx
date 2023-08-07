import {
  ContentState,
  Editor,
  EditorState,
  Modifier,
  SelectionState
} from 'draft-js';
import { useColors } from 'helpers/color';
import { buildVariablePlaceholder, buildVariableRegexp } from 'helpers/format';
import { OrderedSet } from 'immutable';
import { useEffect, useRef, useState } from 'react';
import { useSetRecoilState } from 'recoil';

import EditorWrapper from 'components/organisms/playground/editor/wrapper';

import { IPrompt } from 'state/chat';
import { variableState } from 'state/playground';

import 'draft-js/dist/Draft.css';

export interface IHighlight {
  name: string;
  styleIndex: number;
  content?: string;
}

interface Props {
  template?: string;
  formatted?: string;
  prompt: IPrompt;
  readOnly?: boolean;
  onChange?: (state: EditorState) => void;
  showTitle?: boolean;
}

function useCustomStyleMap() {
  const colors = useColors(true);

  const customStyleMap: Record<string, Record<string, string>> = {};

  for (let i = 0; i < colors.length; i++) {
    customStyleMap[i.toString()] = {
      background: colors[i],
      borderRadius: '2px',
      cursor: 'pointer'
    };
  }

  return customStyleMap;
}

function matchVariable(text: string, variableName: string, format: string) {
  const regexp = buildVariableRegexp(variableName, format);
  const indices: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = regexp.exec(text)) !== null) {
    indices.push(match.index);
  }

  return indices.length ? indices : [-1];
}

function highlight(
  state: EditorState,
  highlights: IHighlight[],
  format: string
) {
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
      const startIndices = matchVariable(text, highlight.name, format);

      let offset = 0;

      const content = highlight.content || highlight.name;

      startIndices.forEach((startIndex) => {
        if (startIndex === -1) {
          return;
        }
        const currentSelection = nextState.getSelection();

        const placeholder = buildVariablePlaceholder(highlight.name, format);

        const end = startIndex + offset + placeholder.length;

        const selectionToHighlight = new SelectionState({
          anchorKey: key,
          anchorOffset: startIndex + offset,
          focusKey: key,
          focusOffset: end
        });

        offset += content.length - placeholder.length;

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
          content,
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

  if (!block) {
    return;
  }

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

export default function FormattedEditor({
  template,
  formatted,
  prompt,
  readOnly,
  onChange,
  showTitle = false
}: Props) {
  const editorRef = useRef<Editor>(null);
  const setVariable = useSetRecoilState(variableState);

  const [state, setState] = useState<EditorState | undefined>();

  const customStyleMap = useCustomStyleMap();

  useEffect(() => {
    if (typeof template === 'string') {
      const inputs = prompt.inputs || {};

      const variables = Object.keys(inputs);
      const highlights: IHighlight[] = [];

      for (let i = 0; i < variables.length; i++) {
        const variableName = variables[i];

        const variableContent = inputs[variableName];

        highlights.push({
          name: variableName,
          styleIndex: i,
          content: variableContent
        });
      }

      const state = EditorState.createWithContent(
        ContentState.createFromText(template)
      );
      const nextState = highlight(state, highlights, prompt.template_format);

      setState(nextState);
    } else if (typeof formatted === 'string') {
      const nextState = EditorState.createWithContent(
        ContentState.createFromText(formatted)
      );
      setState(nextState);
    }
  }, [prompt.template, prompt.inputs]);

  const handleOnEditorChange = (nextState: EditorState) => {
    const entity = getEntityAtSelection(nextState);
    if (entity && editorRef.current) {
      // Open the variable modal
      setVariable(entity.data.name);

      // If we do not blur the selection stay the same
      // And we keep opening the variable
      editorRef.current.blur();
    }

    if (!readOnly) {
      // update editor
      onChange && onChange(nextState);
    } else if (state) {
      // Read only mode, force content but preserve selection
      nextState = EditorState.push(
        nextState,
        state.getCurrentContent(),
        'insert-characters'
      );
    }
    setState(nextState);
  };

  if (!state) {
    return null;
  }

  return (
    <EditorWrapper
      className="formatted-editor"
      title={showTitle ? 'Formatted prompt' : undefined}
      clipboardValue={state?.getCurrentContent().getPlainText()}
    >
      <Editor
        ref={editorRef}
        customStyleMap={customStyleMap}
        editorState={state}
        onChange={handleOnEditorChange}
      />
    </EditorWrapper>
  );
}
