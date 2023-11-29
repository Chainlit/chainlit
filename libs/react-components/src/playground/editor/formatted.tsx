import { PlaygroundContext } from 'contexts/PlaygroundContext';
import {
  ContentState,
  Editor,
  EditorState,
  Modifier,
  SelectionState
} from 'draft-js';
import { OrderedSet } from 'immutable';
import isEqual from 'lodash/isEqual';
import merge from 'lodash/merge';
import { useContext, useRef, useState } from 'react';
import EditorWrapper from 'src/playground/editor/EditorWrapper';
import {
  buildEscapeReplaceRegexp,
  buildTemplatePlaceholderRegexp,
  escape,
  validateVariablePlaceholder
} from 'src/playground/helpers/format';
import { useIsFirstRender } from 'usehooks-ts';

import { useColors } from 'hooks/useColors';

import type { IGeneration } from 'client-types/';

import 'draft-js/dist/Draft.css';

export interface IVariable {
  name: string;
  styleIndex: number;
  content?: string;
}

interface Props {
  template?: string;
  formatted?: string;
  format: string;
  inputs: IGeneration['inputs'];
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

/* This function takes a draftjs block content and matches all escaping and interpolation
 * candidates using a regexp specific to the current template format. f-string example:
 * "Hello this is a {{{{variable}}}}" would match "{{{{variable}}}}".
 */
function matchToEscapeOrReplace(text: string, format: string) {
  const regexp = buildEscapeReplaceRegexp(format);
  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;

  while ((match = regexp.exec(text)) !== null) {
    if (match.index > -1) {
      matches.push(match);
    }
  }

  return matches;
}

// This function takes a text and tries to match a variable placeholder to replace
function matchVariable(text: string, variableName: string, format: string) {
  // Get the regex based on the current template format
  const regex = buildTemplatePlaceholderRegexp(variableName, format);
  const match = regex.exec(text);
  const matchedVariable = match?.[0];
  if (matchedVariable) {
    // We found a variable candidate for instance {{{{variable}}}}".
    // We now need to validate that we need to replace it.
    const { ok } = validateVariablePlaceholder(
      variableName,
      matchedVariable,
      format
    );
    return { match: matchedVariable, ok };
  } else {
    return { match: '', ok: false };
  }
}

function formatTemplate(
  state: EditorState,
  variables: IVariable[],
  format: string
) {
  let contentState = state.getCurrentContent();
  let nextState = state;

  // Iterate each block in the editor.
  // At this point the editor content is still the template
  contentState.getBlockMap().forEach((contentBlock) => {
    if (!contentBlock) {
      return;
    }

    const key = contentBlock.getKey();
    const text = contentBlock.getText();

    // Get the substrings of the block to escape/replace
    const ssmToEscapeOrReplace = matchToEscapeOrReplace(text, format);

    // We start with escaping

    // Each escaping will change the block text length.
    // We need to keep track of the length diff (offset) to keep the escaping accurate.
    let escapeOffset = 0;

    const ssmToEscapeOrReplaceWithVariable = ssmToEscapeOrReplace.map((ssm) => {
      const ss = ssm[0];

      let variableFound: { variable: IVariable; match: string } | undefined =
        undefined;
      // Iterate each variable and try to match it.
      // If there is a match, flag it for replacement later on and break.
      for (const variable of variables) {
        const { match, ok } = matchVariable(ss, variable.name, format);
        if (ok) {
          variableFound = { variable, match };
          break;
        }
      }

      // start index of the selection to escape, accounting for offset
      const startIndex = ssm.index + escapeOffset;
      // end index of the selection to scape, accounting for offset
      const endIndex = startIndex + ss.length;

      // Define the selection of the template to escape
      const selectionToEscape = new SelectionState({
        anchorKey: key,
        anchorOffset: startIndex,
        focusKey: key,
        focusOffset: endIndex
      });

      // Escape the substring
      const content = escape(ss, format);

      // Update the offset (new value length - old value length)
      escapeOffset += content.length - ss.length;

      // Perform the replace operation
      contentState = Modifier.replaceText(
        contentState,
        selectionToEscape,
        content
      );
      nextState = EditorState.push(state, contentState, 'apply-entity');

      // Update the substring match since we just updated it
      ssm[0] = content;
      ssm.index = startIndex;

      return { ssm, variableFound };
    });

    // At this point the template has been escaped
    // We now perform replace operations

    // Each replace will change the block text length.
    // We need to keep track of the length diff (offset) to keep the replace accurate.
    let replaceOffset = 0;

    ssmToEscapeOrReplaceWithVariable.forEach(({ ssm, variableFound }) => {
      if (!variableFound) {
        // Nothing to replace
        return;
      }

      const { variable } = variableFound;

      const ss = ssm[0];

      // It is important to preserve the selection to keep the text selectable (copy paste for instance)
      const currentSelection = nextState.getSelection();

      // We know the variable is here but we need to know the exact range to replace
      // for instance {{{var1}}} was escaped to {{var1}} so we need to replace {var1}
      const { localEndIndex, localStartIndex } = validateVariablePlaceholder(
        variable.name,
        ss,
        format
      );

      // The start of the range is the
      // start index of the whole variable + the local start index
      // of the exact variable match + the offset
      const startIndex = ssm.index + localStartIndex + replaceOffset;

      // Same for the end index
      const endIndex = ssm.index + localEndIndex + replaceOffset;

      // Define the selection to replace
      const selectionToHighlight = new SelectionState({
        anchorKey: key,
        anchorOffset: startIndex,
        focusKey: key,
        focusOffset: endIndex
      });

      const content = variable.content || '';

      // Update the offset
      replaceOffset += content.length - (localEndIndex - localStartIndex);

      // Perform the replace operation
      contentState = nextState.getCurrentContent();
      contentState = contentState.createEntity('TOKEN', 'SEGMENTED', variable);
      const entityKey = contentState.getLastCreatedEntityKey();
      contentState = Modifier.replaceText(
        contentState,
        selectionToHighlight,
        content,
        OrderedSet.of(variable.styleIndex.toString()),
        entityKey
      );
      nextState = EditorState.push(nextState, contentState, 'apply-entity');
      nextState = EditorState.forceSelection(nextState, currentSelection);
    });
  });

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
  inputs,
  format,
  readOnly,
  onChange,
  showTitle = false,
  sxEditorChildren
}: Props) {
  const editorRef = useRef<Editor>(null);
  const { setVariableName, setPromptMode, onNotification } =
    useContext(PlaygroundContext);

  const [state, setState] = useState<EditorState | undefined>();
  const [prevInputs, setPrevInputs] = useState<Record<string, string>>();

  const customStyleMap = useCustomStyleMap();
  const isFirstRender = useIsFirstRender();

  if (isFirstRender || !isEqual(inputs, prevInputs)) {
    if (typeof template === 'string') {
      inputs = inputs || {};

      const variableNames = Object.keys(inputs);
      const variables: IVariable[] = [];

      for (let i = 0; i < variableNames.length; i++) {
        const variableName = variableNames[i];

        const variableContent = inputs[variableName];

        variables.push({
          name: variableName,
          styleIndex: i,
          content: variableContent
        });
      }

      const sortedVariables = variables.sort(
        (a, b) => b.name.length - a.name.length
      );

      const state = EditorState.createWithContent(
        ContentState.createFromText(template)
      );
      const nextState = formatTemplate(state, sortedVariables, format);

      setState(nextState);
    } else if (typeof formatted === 'string') {
      const nextState = EditorState.createWithContent(
        ContentState.createFromText(formatted)
      );
      setState(nextState);
    }
    setPrevInputs(inputs);
  }

  const handleOnEditorChange = (nextState: EditorState) => {
    const hasFocus = nextState.getSelection().getHasFocus();
    const isCollapsed = nextState.getSelection().isCollapsed();
    const entity = getEntityAtSelection(nextState);
    if (entity && hasFocus && isCollapsed && editorRef.current) {
      // Open the variable modal
      setVariableName(entity.data.name);

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
        onNotification(
          'error',
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
              backgroundColor: 'transparent',
              borderColor: 'transparent !important'
            }
          : {}
      )}
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
