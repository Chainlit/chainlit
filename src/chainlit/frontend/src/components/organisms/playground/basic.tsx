import { EditorState } from 'draft-js';
import { useSetRecoilState } from 'recoil';

import { Alert } from '@mui/material';

import { PromptMode } from 'components/organisms/playground/index';

import { IPrompt } from 'state/chat';
import { playgroundState } from 'state/playground';

import Completion from './editor/completion';
import FormattedEditor from './editor/formatted';
import TemplateEditor from './editor/template';

interface Props {
  prompt: IPrompt;
  mode: PromptMode;
  hasTemplate: boolean;
}

export default function BasicPromptPlayground({
  hasTemplate,
  prompt,
  mode
}: Props) {
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

  const onFormattedChange = (nextState: EditorState) => {
    const formatted = nextState.getCurrentContent().getPlainText();
    setPlayground((old) => ({
      ...old,
      prompt: {
        ...old.prompt!,
        formatted
      }
    }));
  };

  const renderTemplate = () => {
    return (
      <TemplateEditor
        template={prompt.template || ''}
        prompt={prompt}
        onChange={onTemplateChange}
      />
    );
  };

  const renderFormatted = () => {
    if (hasTemplate) {
      return (
        <FormattedEditor template={prompt.template!} prompt={prompt} readOnly />
      );
    } else if (typeof prompt.formatted === 'string') {
      return (
        <FormattedEditor
          formatted={prompt.formatted}
          prompt={prompt}
          readOnly={false}
          onChange={onFormattedChange}
        />
      );
    } else {
      return (
        <Alert severity="error">
          Neither template or formatted prompt provided.
        </Alert>
      );
    }
  };

  return (
    <>
      {mode === 'Template' ? renderTemplate() : null}
      {mode === 'Formatted' ? renderFormatted() : null}
      <Completion completion={prompt.completion} />
    </>
  );
}
