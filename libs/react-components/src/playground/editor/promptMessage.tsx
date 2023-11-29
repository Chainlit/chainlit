import { EditorState } from 'draft-js';

import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';

import type { IChatGeneration, IGenerationMessage } from 'client-types/';
import { PromptMode } from 'src/types/playground';

import MessageWrapper from './MessageWrapper';
import FormattedEditor from './formatted';
import TemplateEditor from './template';

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
    inputs: generation.inputs,
    format: message.templateFormat,
    sxEditorChildren: {
      padding: theme.spacing(2),
      backgroundColor: '',
      '&:hover': {
        background: theme.palette.background.paper
      }
    }
  };

  const renderTemplate = () => {
    return (
      <TemplateEditor
        {...templateProps}
        showTitle={false}
        template={message.template || message.formatted || ''}
        onChange={(state) => onChange(index, state)}
      />
    );
  };

  const renderFormatted = () => {
    if (typeof message.template === 'string') {
      return (
        <FormattedEditor
          {...templateProps}
          template={message.template}
          readOnly
        />
      );
    } else if (typeof message.formatted === 'string') {
      return (
        <FormattedEditor
          {...templateProps}
          onChange={(state) => onChange(index, state)}
          formatted={message.formatted}
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
      <>
        {mode === 'Template' ? renderTemplate() : null}
        {mode === 'Formatted' ? renderFormatted() : null}
      </>
    </MessageWrapper>
  );
}
