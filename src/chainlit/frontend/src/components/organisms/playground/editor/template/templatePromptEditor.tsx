import {
  CompositeDecorator,
  ContentBlock,
  ContentState,
  DraftDecorator,
  Editor,
  EditorState
} from 'draft-js';
import { useEffect, useState } from 'react';

import EditorWrapper from 'components/organisms/playground/editor/editorWrapper';

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
}

export default function TemplatePromptEditor({ prompt }: Props) {
  const [state, setState] = useState<EditorState | undefined>();
  useEffect(() => {
    const variableDecorator: DraftDecorator = {
      strategy: (contentBlock, callback) => {
        const regex = /(?<!\{)\{([^{}]+)\}(?!\})/g;
        findWithRegex(regex, contentBlock, callback);
      },
      component: Variable,
      props: {
        prompt
      }
    };

    const decorators = new CompositeDecorator([variableDecorator]);

    const state = ContentState.createFromText(prompt.template!);
    setState(EditorState.createWithContent(state, decorators));
  }, [prompt]);

  if (!state) {
    return null;
  }

  return (
    <EditorWrapper title="Template">
      <Editor
        editorState={state}
        onChange={(nextState) => {
          setState(nextState);
        }}
      />
    </EditorWrapper>
  );
}
