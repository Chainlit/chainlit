import { EditorState } from 'draft-js';
import { useSetRecoilState } from 'recoil';

import { Box, Stack, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';

import { PromptMode } from 'components/organisms/playground/index';

import { IPrompt } from 'state/chat';
import { playgroundState } from 'state/playground';

import Completion from './editor/completion';
import PromptMessage from './editor/promptMessage';

interface Props {
  prompt: IPrompt;
  mode: PromptMode;
  hasTemplate: boolean;
  restoredTime: number;
}

export default function ChatPromptPlayground({
  hasTemplate,
  prompt,
  mode,
  restoredTime
}: Props) {
  const setPlayground = useSetRecoilState(playgroundState);

  const messages = prompt.messages;

  if (!messages) {
    return null;
  }

  const onChange = (index: number, nextState: EditorState) => {
    const text = nextState.getCurrentContent().getPlainText();
    const key = hasTemplate ? 'template' : 'formatted';

    setPlayground((old) => ({
      ...old,
      prompt: {
        ...old.prompt!,
        messages: old.prompt?.messages?.map((message, mIndex) => {
          if (mIndex === index) {
            return {
              ...message,
              [key]: text
            };
          }
          return message;
        })
      }
    }));
  };

  const title =
    mode === 'Formatted'
      ? hasTemplate
        ? 'Formatted messages [Read Only]'
        : 'Formatted messages'
      : 'Prompt messages';

  return (
    <Stack
      sx={{
        width: '100%'
      }}
    >
      <Typography fontSize="14px" fontWeight={700} color={grey[400]}>
        {title}
      </Typography>
      <Box
        key={restoredTime} // This will re-mount the component with restored messages
        sx={{
          flex: 1,
          height: 'auto',
          overflow: 'scroll',
          marginTop: 1,
          gap: 1
        }}
      >
        {messages.length > 0 ? (
          <Stack>
            {messages.map((message, index) => (
              <>
                <PromptMessage
                  message={message}
                  prompt={prompt}
                  mode={mode}
                  index={index}
                  key={`prompt-message-${index}`}
                  onChange={onChange}
                />
                {index !== messages.length - 1 ? (
                  <Box
                    sx={{
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      borderRadius: 1
                    }}
                  />
                ) : null}
              </>
            ))}
          </Stack>
        ) : null}
      </Box>
      <Completion completion={prompt.completion} />
    </Stack>
  );
}
