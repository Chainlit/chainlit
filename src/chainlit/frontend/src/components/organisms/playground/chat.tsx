import { EditorState } from 'draft-js';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
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
}

export default function ChatPromptPlayground({
  hasTemplate,
  prompt,
  mode
}: Props) {
  const setPlayground = useSetRecoilState(playgroundState);

  if (!prompt.messages) {
    return null;
  }

  const onChange = (index: number, nextState: EditorState) => {
    const text = nextState.getCurrentContent().getPlainText();
    const key = hasTemplate ? 'template' : 'formatted';

    setPlayground((old) =>
      merge(cloneDeep(old), {
        prompt: {
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
      })
    );
  };

  return (
    <Stack
      sx={{
        width: '100%'
      }}
    >
      <Typography fontSize="14px" fontWeight={700} color={grey[400]}>
        {'Prompt'}
      </Typography>
      <Box
        sx={{
          flex: 1,
          height: 'auto',
          overflow: 'scroll',
          borderRadius: 1,
          padding: 3,
          marginTop: 1,
          gap: 1,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          background: (theme) => theme.palette.background.paper
        }}
      >
        <Stack>
          {prompt.messages?.map((message, index) => (
            <PromptMessage
              message={message}
              prompt={prompt}
              mode={mode}
              index={index}
              key={`prompt-message-${index}`}
              onChange={onChange}
            />
          ))}
        </Stack>
      </Box>
      <Completion completion={prompt.completion} />
    </Stack>
  );
}
