import { EditorState } from 'draft-js';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import { useSetRecoilState } from 'recoil';
import { useToggle } from 'usehooks-ts';

import {
  ArrowCircleDownOutlined,
  ArrowCircleUpOutlined
} from '@mui/icons-material';
import { Box, IconButton, Stack, Typography } from '@mui/material';
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
  const [isCompletionOpen, toggleCompletion] = useToggle(false);

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
        width: '100%',
        height: '100%',
        justifyContent: 'space-between'
      }}
    >
      <Typography fontSize="14px" fontWeight={700} color={grey[400]}>
        {'Prompt'}
      </Typography>
      <Box
        sx={{
          height: 'auto',
          overflow: 'scroll',
          borderRadius: 1,
          padding: 3,
          marginTop: 1,
          gap: 1,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          background: (theme) => theme.palette.background.paper,
          boxShadow: (theme) =>
            theme.palette.mode === 'light'
              ? '0px 2px 4px 0px #0000000D'
              : '0px 10px 10px 0px #0000000D'
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
      <Box sx={{ maxHeight: '300px', marginTop: 2 }}>
        <Stack
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography fontSize="14px" fontWeight={700} color={grey[400]}>
            {'Completion'}
          </Typography>
          <IconButton onClick={toggleCompletion}>
            {isCompletionOpen ? (
              <ArrowCircleDownOutlined />
            ) : (
              <ArrowCircleUpOutlined />
            )}
          </IconButton>
        </Stack>
        <Box
          sx={{
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            marginTop: 1,
            marginBottom: 2
          }}
        />
        <Box
          sx={{
            height: '100%',
            maxHeight: isCompletionOpen ? '200px' : '0px',
            transition: 'max-height 0.5s ease-in-out',
            overflow: 'auto'
          }}
        >
          <Completion completion={prompt.completion} showTitle={false} />
        </Box>
      </Box>
    </Stack>
  );
}
