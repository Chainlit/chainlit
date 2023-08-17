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
import { isEqual } from 'lodash';
import merge from 'lodash/merge';
import { grey } from 'palette';
import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useSetRecoilState } from 'recoil';
import { useIsFirstRender } from 'usehooks-ts';

import { Theme } from '@mui/material';

import EditorWrapper from 'components/organisms/playground/editor/wrapper';

import { IPrompt } from 'state/chat';
import { modeState, variableState } from 'state/playground';

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
  sxEditorChildren?: any;
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

      const content = highlight.content || '';

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
  showTitle = false,
  sxEditorChildren
}: Props) {
  const editorRef = useRef<Editor>(null);
  const setVariable = useSetRecoilState(variableState);
  const setPromptMode = useSetRecoilState(modeState);

  const [state, setState] = useState<EditorState | undefined>();
  const [prevInputs, setPrevInputs] = useState<Record<string, string>>();

  const customStyleMap = useCustomStyleMap();
  const isFirstRender = useIsFirstRender();

  if (isFirstRender || !isEqual(prompt.inputs, prevInputs)) {
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
    setPrevInputs(prompt.inputs);
  }

  const handleOnEditorChange = (nextState: EditorState) => {
    const hasFocus = nextState.getSelection().getHasFocus();

    const entity = getEntityAtSelection(nextState);
    if (entity && hasFocus && editorRef.current) {
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
      const currentContent = state.getCurrentContent();
      const nextContent = nextState.getCurrentContent();

      if (currentContent !== nextContent) {
        toast.error(
          'Formatted prompt is read only. Edit the template/variables instead.'
        );
        setPromptMode('Template');
      }

      // Read only mode, force content but preserve selection
      nextState = EditorState.push(
        nextState,
        currentContent,
        'insert-characters'
      );
    }
    setState(nextState);
  };

  if (!state) {
    return null;
  }

  const title = readOnly ? 'Formatted prompt [Read Only]' : 'Formatted prompt';

  return (
    <EditorWrapper
      className="formatted-editor"
      title={showTitle ? title : undefined}
      clipboardValue={state?.getCurrentContent().getPlainText()}
      sxChildren={merge(
        sxEditorChildren || {},
        readOnly
          ? {
              caretColor: 'transparent',
              backgroundColor: (theme: Theme) => theme.palette.background.paper,
              borderColor: (theme: Theme) =>
                theme.palette.mode === 'light' ? grey[400] : 'white'
            }
          : {}
      )}
    >
      <Editor
        ref={editorRef}
        customStyleMap={customStyleMap}
        editorState={state}
        onChange={handleOnEditorChange}
        customStyleFn={() => ({
          fontStyle: 'italic'
        })}
      />
    </EditorWrapper>
  );
}
