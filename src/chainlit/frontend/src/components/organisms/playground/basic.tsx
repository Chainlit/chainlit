import { EditorState } from 'draft-js';
import { useSetRecoilState } from 'recoil';

import { IPrompt } from 'state/chat';
import { playgroundState } from 'state/playground';

import { PromptMode } from '.';
import Completion from './editor/completion';
import FromattedEditor from './editor/formatted';
import TemplateEditor from './editor/template';

interface Props {
  prompt: IPrompt;
  mode: PromptMode;
}

export default function BasicPromptPlayground({ prompt, mode }: Props) {
  const setPlayground = useSetRecoilState(playgroundState);

  if (prompt.messages) {
    return null;
  }

  const onTemplateChange = (nextState: EditorState) => {
    const template = nextState.getCurrentContent().getPlainText();
    setPlayground((old) => ({
      ...old,
      prompt: {
        ...old.prompt!,
        template
      }
    }));
  };

  const renderTemplate = () => {
    if (!prompt.template) {
      return null;
    }

    return <TemplateEditor prompt={prompt} onChange={onTemplateChange} />;
  };

  const renderFormatted = () => {
    if (!prompt.template) {
      return null;
    }
    return (
      <FromattedEditor template={prompt.template} prompt={prompt} readOnly />
    );
  };

  return (
    <>
      {mode === 'Template' ? renderTemplate() : null}
      {mode === 'Formatted' ? renderFormatted() : null}
      <Completion completion={prompt.completion} />
    </>
  );
}
