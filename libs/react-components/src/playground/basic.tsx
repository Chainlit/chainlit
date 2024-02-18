import { PlaygroundContext } from 'contexts/PlaygroundContext';
import { EditorState } from 'draft-js';
import { useContext } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

import type { ICompletionGeneration } from 'client-types/';

import Completion from './editor/completion';
import FormattedEditor from './editor/formatted';

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

  const renderFormatted = () => {
    if (typeof generation.prompt === 'string') {
      return (
        <FormattedEditor
          showTitle={true}
          formatted={generation.prompt || ''}
          inputs={generation.variables || {}}
          format={'f-string'}
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
      {promptMode === 'Formatted' ? renderFormatted() : null}
      <Completion completion={generation.completion} />
    </Stack>
  );
}
