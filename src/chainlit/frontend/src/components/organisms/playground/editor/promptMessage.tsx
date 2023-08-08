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
        sxEditorChildren={{ padding: '14px' }}
      />
    );
  };

  const renderFormatted = () => {
    const props = {
      sxEditorChildren: { padding: '14px !important' },
      prompt
    };

    if (typeof message.template === 'string') {
      return (
        <FormattedEditor {...props} template={message.template} readOnly />
      );
    } else if (typeof message.formatted === 'string') {
      return (
        <FormattedEditor
          {...props}
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
        padding: '8px 16px'
      }}
    >
      <Stack
        sx={{
          fontSize: '12px',
          fontWeight: 700,
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
            iconSx={{
              px: 0,
              marginRight: '2px !important'
            }}
          />
        ) : (
          <Typography
            onClick={toggleSelectRole}
            color="text.primary"
            sx={{
              marginTop: 2,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
              width: 'fit-content',
              padding: '4px 8px',
              '&:hover': {
                backgroundColor: (theme) => theme.palette.divider,
                borderRadius: 0.5
              }
            }}
          >
            {message.role.toUpperCase()}
          </Typography>
        )}
      </Stack>

      <Box sx={{ width: '90%' }}>
        {mode === 'Template' ? renderTemplate() : null}
        {mode === 'Formatted' ? renderFormatted() : null}
      </Box>
    </Stack>
  );
}
