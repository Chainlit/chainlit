import { EditorState } from 'draft-js';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import { Alert, Stack } from '@mui/material';

import { IPrompt } from '@chainlit/components';

import { modeState, playgroundState } from 'state/playground';

import Completion from './editor/completion';
import FormattedEditor from './editor/formatted';
import TemplateEditor from './editor/template';

interface Props {
  prompt: IPrompt;
  hasTemplate: boolean;
  restoredTime: number;
}

export default function BasicPromptPlayground({
  hasTemplate,
  prompt,
  restoredTime
}: Props) {
  const mode = useRecoilValue(modeState);
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
        showTitle={true}
        template={prompt.template || ''}
        prompt={prompt}
        onChange={onTemplateChange}
      />
    );
  };

  const renderFormatted = () => {
    if (hasTemplate) {
      return (
        <FormattedEditor
          showTitle={true}
          template={prompt.template!}
          prompt={prompt}
          readOnly
        />
      );
    } else if (typeof prompt.formatted === 'string') {
      return (
        <FormattedEditor
          showTitle={true}
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
    <Stack
      flex={1}
      key={restoredTime} // This will re-mount the component with restored prompt
      width="100%"
    >
      {mode === 'Template' ? renderTemplate() : null}
      {mode === 'Formatted' ? renderFormatted() : null}
      <Completion completion={prompt.completion} />
    </Stack>
  );
}
