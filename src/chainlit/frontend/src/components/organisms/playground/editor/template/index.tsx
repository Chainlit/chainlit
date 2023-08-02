import {
  CompositeDecorator,
  ContentBlock,
  ContentState,
  DraftDecorator,
  Editor,
  EditorState
} from 'draft-js';
import { buildTemplateRegexp } from 'helpers/format';
import { useState } from 'react';
import { useIsFirstRender } from 'usehooks-ts';

import EditorWrapper from 'components/organisms/playground/editor/wrapper';

import { IPrompt } from 'state/chat';

import Variable from './variable';

const findWithRegex = (
  regex: RegExp,
  contentBlock: ContentBlock,
  callback: (start: number, end: number) => void
) => {
  const text = contentBlock.getText();
  let matchArr: RegExpExecArray | null, start: number;
  while ((matchArr = regex.exec(text)) !== null) {
    start = matchArr.index;
    callback(start, start + matchArr[0].length);
  }
};

interface Props {
  prompt: IPrompt;
  template?: string;
  onChange(nextState: EditorState): void;
}

export default function TemplateEditor({ prompt, template, onChange }: Props) {
  const [state, setState] = useState<EditorState | undefined>();
  const isFirstRender = useIsFirstRender();

  if (isFirstRender) {
    const contentState = ContentState.createFromText(
      template || prompt.template!
    );

    const variableDecorator: DraftDecorator = {
      strategy: (contentBlock, callback) => {
        findWithRegex(buildTemplateRegexp(prompt), contentBlock, callback);
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
    <EditorWrapper title="Template">
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
