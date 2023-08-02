import {
  CompositeDecorator,
  ContentBlock,
  ContentState,
  DraftDecorator,
  Editor,
  EditorState
} from 'draft-js';
import { useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { useIsFirstRender } from 'usehooks-ts';

import EditorWrapper from 'components/organisms/playground/editor/editorWrapper';

import { IPrompt } from 'state/chat';
import { playgroundState } from 'state/playground';

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
  const setPlayground = useSetRecoilState(playgroundState);
  const [state, setState] = useState<EditorState | undefined>();
  const isFirstRender = useIsFirstRender();

  if (isFirstRender) {
    const contentState = ContentState.createFromText(prompt.template!);

    const variables = Object.keys(prompt.inputs || {}).sort(
      (a, b) => b.length - a.length
    );
    const variableDecorator: DraftDecorator = {
      strategy: (contentBlock, callback) => {
        // Create a regex pattern from the variables array
        const regexPattern = variables.map((v) => `\\b${v}\\b`).join('|');
        const regex = new RegExp(`(?<!\\{)\\{(${regexPattern})\\}(?!\\})`, 'g');
        findWithRegex(regex, contentBlock, callback);
      },
      component: Variable,
      props: {
        prompt
      }
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

          const template = nextState.getCurrentContent().getPlainText();
          setPlayground((old) => ({
            ...old,
            prompt: {
              ...old.prompt!,
              template
            }
          }));
        }}
      />
    </EditorWrapper>
  );
}
