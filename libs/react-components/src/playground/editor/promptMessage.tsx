import { EditorState } from 'draft-js';

import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';

import type { IChatGeneration, IGenerationMessage } from 'client-types/';
import { PromptMode } from 'src/types/playground';

import MessageWrapper from './MessageWrapper';
import FormattedEditor from './formatted';

interface Props {
  message: IGenerationMessage;
  generation: IChatGeneration;
  mode: PromptMode;
  index: number;
  onChange: (index: number, nextState: EditorState) => void;
}

export default function PromptMessage({
  message,
  generation,
  mode,
  index,
  onChange
}: Props) {
  const theme = useTheme();

  const templateProps = {
    inputs: generation.variables || {},
    format: 'f-string',
    sxEditorChildren: {
      padding: theme.spacing(2),
      backgroundColor: '',
      '&:hover': {
        background: theme.palette.background.paper
      }
    }
  };

  const renderFormatted = () => {
    if (typeof message.content === 'string') {
      return (
        <FormattedEditor
          {...templateProps}
          onChange={(state) => onChange(index, state)}
          formatted={message.content}
          readOnly={false}
          showTitle={false}
        />
      );
    }

    return (
      <Alert severity="error">
        Neither template or formatted prompt provided.
      </Alert>
    );
  };

  return (
    <MessageWrapper
      canSelectRole
      index={index}
      message={message}
      role={message.role?.toUpperCase()}
      name={message.name}
    >
      <>{mode === 'Formatted' ? renderFormatted() : null}</>
    </MessageWrapper>
  );
}
