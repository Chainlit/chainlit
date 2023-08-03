import { EditorState } from 'draft-js';

import { Alert, Box, Stack, Typography } from '@mui/material';

import { IPrompt, IPromptMessage } from 'state/chat';

import { PromptMode } from '..';
import FormattedEditor from './formatted';
import TemplateEditor from './template';

interface Props {
  message: IPromptMessage;
  prompt: IPrompt;
  mode: PromptMode;
  index: number;
  onChange: (index: number, nextState: EditorState) => void;
}

export default function PromptMessage({
  message,
  prompt,
  mode,
  index,
  onChange
}: Props) {
  const renderTemplate = () => {
    return (
      <TemplateEditor
        showTitle={false}
        template={message.template!}
        prompt={prompt}
        onChange={(state) => onChange(index, state)}
      />
    );
  };

  const renderFormatted = () => {
    if (typeof message.template === 'string') {
      return (
        <FormattedEditor template={message.template} prompt={prompt} readOnly />
      );
    } else if (typeof message.formatted === 'string') {
      return (
        <FormattedEditor
          onChange={(state) => onChange(index, state)}
          formatted={message.formatted}
          prompt={prompt}
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
    <Stack
      key={index}
      direction="row"
      sx={{
        background: (theme) => theme.palette.background.default,
        padding: '8px 24px',
        alignItems: 'center'
      }}
    >
      <Typography
        color="text.primary"
        sx={{
          flex: 1,
          fontSize: '12px',
          fontWeight: 700,
          textAlign: 'center'
        }}
      >
        {message.role.toUpperCase()}
      </Typography>
      <Box sx={{ minWidth: '80%' }}>
        {mode === 'Template' ? renderTemplate() : null}
        {mode === 'Formatted' ? renderFormatted() : null}
      </Box>
    </Stack>
  );
}
