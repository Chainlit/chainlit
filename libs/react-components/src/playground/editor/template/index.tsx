import {
  CompositeDecorator,
  ContentBlock,
  ContentState,
  DraftDecorator,
  Editor,
  EditorState
} from 'draft-js';
import { useState } from 'react';
import EditorWrapper from 'src/playground/editor/EditorWrapper';
import {
  buildTemplatePlaceholdersRegexp,
  validateVariablePlaceholder
} from 'src/playground/helpers/format';
import { useIsFirstRender } from 'usehooks-ts';

import type { IGeneration } from 'client-types/';

import Variable from './variable';

const findVariable = (
  regex: RegExp | undefined,
  format: string,
  contentBlock: ContentBlock,
  callback: (start: number, end: number) => void
) => {
  if (!regex) {
    return;
  }
  const text = contentBlock.getText();
  let matchArr: RegExpExecArray | null;
  while ((matchArr = regex.exec(text)) !== null) {
    const { ok, localEndIndex, localStartIndex } = validateVariablePlaceholder(
      matchArr[1],
      matchArr[0],
      format
    );
    if (!ok) {
      continue;
    }
    const start = matchArr.index + localStartIndex;
    const end = matchArr.index + localEndIndex;
    callback(start, end);
  }
};

interface Props {
  inputs: IGeneration['inputs'];
  format: string;
  template: string;
  onChange(nextState: EditorState): void;
  showTitle?: boolean;
  sxEditorChildren?: any;
}

export default function TemplateEditor({
  inputs,
  format,
  template,
  onChange,
  showTitle = true,
  sxEditorChildren
}: Props) {
  const [state, setState] = useState<EditorState | undefined>();
  const isFirstRender = useIsFirstRender();

  if (isFirstRender) {
    const contentState = ContentState.createFromText(template);
    const variableDecorator: DraftDecorator = {
      strategy: (contentBlock, callback) => {
        findVariable(
          buildTemplatePlaceholdersRegexp(inputs || {}, format),
          format,
          contentBlock,
          callback
        );
      },
      component: Variable
    };

    const decorators = new CompositeDecorator([variableDecorator]);
    setState(EditorState.createWithContent(contentState, decorators));
  }

  if (!state) {
    return null;
  }

  return (
    <EditorWrapper
      className="template-editor"
      title={showTitle ? 'Prompt Template' : undefined}
      clipboardValue={state?.getCurrentContent().getPlainText()}
      sxChildren={sxEditorChildren}
    >
      <Editor
        editorState={state}
        onChange={(nextState) => {
          setState(nextState);
          onChange && onChange(nextState);
        }}
      />
    </EditorWrapper>
  );
}
