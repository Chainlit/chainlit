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
import PromptMessage from './editor/message';

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
    <>
      <Box
        sx={{
          width: '100%',
          height: 'fit-content'
        }}
      >
        <Typography fontSize="14px" fontWeight={700} color={grey[400]}>
          {'Prompt'}
        </Typography>
        <Stack
          sx={{
            marginTop: 1,
            borderRadius: 1,
            padding: 3,
            gap: 1,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            background: (theme) => theme.palette.background.paper,
            boxShadow: (theme) =>
              theme.palette.mode === 'light'
                ? '0px 2px 4px 0px #0000000D'
                : '0px 10px 10px 0px #0000000D'
          }}
        >
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
    </>
  );
}
