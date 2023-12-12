import { PlaygroundContext } from 'contexts/PlaygroundContext';
import { EditorState } from 'draft-js';
import { useContext } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

import type { ICompletionGeneration } from 'client-types/';

import Completion from './editor/completion';
import FormattedEditor from './editor/formatted';
import TemplateEditor from './editor/template';

interface Props {
  generation: ICompletionGeneration;
  hasTemplate: boolean;
  restoredTime: number;
}

export default function BasicPromptPlayground({
  generation,
  restoredTime
}: Props) {
  const { promptMode, setPlayground } = useContext(PlaygroundContext);

  const onTemplateChange = (nextState: EditorState) => {
    const template = nextState.getCurrentContent().getPlainText();
    setPlayground((old) => ({
      ...old,
      generation: {
        ...old!.generation!,
        template
      }
    }));
  };

  const onFormattedChange = (nextState: EditorState) => {
    const formatted = nextState.getCurrentContent().getPlainText();
    setPlayground((old) => ({
      ...old,
      generation: {
        ...old!.generation!,
        formatted
      }
    }));
  };

  const renderTemplate = () => {
    return (
      <TemplateEditor
        showTitle={true}
        template={generation.template || generation.formatted || ''}
        inputs={generation.inputs}
        format={generation.templateFormat}
        onChange={onTemplateChange}
      />
    );
  };

  const renderFormatted = () => {
    if (typeof generation.template === 'string') {
      return (
        <FormattedEditor
          showTitle={true}
          template={generation.template}
          inputs={generation.inputs}
          format={generation.templateFormat}
          readOnly
        />
      );
    } else if (typeof generation.formatted === 'string') {
      return (
        <FormattedEditor
          showTitle={true}
          formatted={generation.formatted}
          inputs={generation.inputs}
          format={generation.templateFormat}
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
      <Completion completion={generation.completion} />
    </Stack>
  );
}
