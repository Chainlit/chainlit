import { PlaygroundContext } from 'contexts/PlaygroundContext';
import { EditorState } from 'draft-js';
import { useContext } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

import { IPrompt } from 'src/types/message';

import Completion from './editor/completion';
import FormattedEditor from './editor/formatted';
import TemplateEditor from './editor/template';

interface Props {
  prompt: IPrompt;
  hasTemplate: boolean;
  restoredTime: number;
}

export default function BasicPromptPlayground({ prompt, restoredTime }: Props) {
  const { promptMode, setPlayground } = useContext(PlaygroundContext);

  if (prompt.messages) {
    return null;
  }

  const onTemplateChange = (nextState: EditorState) => {
    const template = nextState.getCurrentContent().getPlainText();
    setPlayground((old) => ({
      ...old,
      prompt: {
        ...old!.prompt!,
        template
      }
    }));
  };

  const onFormattedChange = (nextState: EditorState) => {
    const formatted = nextState.getCurrentContent().getPlainText();
    setPlayground((old) => ({
      ...old,
      prompt: {
        ...old!.prompt!,
        formatted
      }
    }));
  };

  const renderTemplate = () => {
    return (
      <TemplateEditor
        showTitle={true}
        template={prompt.template || prompt.formatted || ''}
        prompt={prompt}
        onChange={onTemplateChange}
      />
    );
  };

  const renderFormatted = () => {
    if (typeof prompt.template === 'string') {
      return (
        <FormattedEditor
          showTitle={true}
          template={prompt.template}
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
      {promptMode === 'Template' ? renderTemplate() : null}
      {promptMode === 'Formatted' ? renderFormatted() : null}
      <Completion completion={prompt.completion} />
    </Stack>
  );
}
