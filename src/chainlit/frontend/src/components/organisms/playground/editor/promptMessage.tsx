import { EditorState } from 'draft-js';
import { useSetRecoilState } from 'recoil';
import { useToggle } from 'usehooks-ts';

import { Alert, Box, Stack, Typography } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

import SelectInput from 'components/organisms/inputs/selectInput';

import { IPrompt, IPromptMessage, PromptMessageRole } from 'state/chat';
import { playgroundState } from 'state/playground';

import { PromptMode } from '..';
import FormattedEditor from './formatted';
import TemplateEditor from './template';

const roles = ['Assistant', 'System', 'User'];

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
  const setPlayground = useSetRecoilState(playgroundState);
  const [isSelectRoleOpen, toggleSelectRole] = useToggle();

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

  const onRoleSelected = (event: SelectChangeEvent) => {
    const role = event.target.value as PromptMessageRole;

    if (role) {
      setPlayground((old) => ({
        ...old,
        prompt: {
          ...old.prompt!,
          messages: old.prompt?.messages?.map((message, mIndex) => ({
            ...message,
            ...(mIndex === index ? { role } : {}) // Update role if it's the selected message
          }))
        }
      }));
    }

    toggleSelectRole();
  };

  return (
    <Stack
      className="prompt-message"
      key={index}
      direction="row"
      sx={{
        background: (theme) => theme.palette.background.default,
        padding: '8px 24px'
      }}
    >
      <Box
        sx={{
          fontSize: '12px',
          fontWeight: 700,
          paddingTop: 3,
          paddingRight: 2,
          maxWidth: '100px',
          width: '100%'
        }}
      >
        {isSelectRoleOpen ? (
          <SelectInput
            defaultOpen
            items={roles.map((role) => ({
              label: role,
              value: role.toLowerCase()
            }))}
            id="role-select"
            value={message.role}
            onChange={onRoleSelected}
          />
        ) : (
          <Typography
            onClick={toggleSelectRole}
            color="text.primary"
            sx={{
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            {message.role.toUpperCase()}
          </Typography>
        )}
      </Box>

      <Box sx={{ width: '90%' }}>
        {mode === 'Template' ? renderTemplate() : null}
        {mode === 'Formatted' ? renderFormatted() : null}
      </Box>
    </Stack>
  );
}
