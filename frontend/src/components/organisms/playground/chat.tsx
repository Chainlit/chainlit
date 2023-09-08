import { EditorState } from 'draft-js';
import { Fragment, forwardRef } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import { Box, Stack, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';

import { IPrompt } from '@chainlit/components';

import { modeState, playgroundState } from 'state/playground';

import Completion from './editor/completion';
import PromptMessage from './editor/promptMessage';

interface Props {
  prompt: IPrompt;
  hasTemplate: boolean;
  restoredTime: number;
}

export const ChatPromptPlayground = forwardRef(
  ({ hasTemplate, prompt, restoredTime }: Props, ref) => {
    const setPlayground = useSetRecoilState(playgroundState);
    const mode = useRecoilValue(modeState);

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
      <Stack sx={{ width: '100%' }}>
        <Typography fontSize="14px" fontWeight={700} color={grey[400]}>
          {title}
        </Typography>
        <Box
          key={restoredTime} // This will re-mount the component with restored messages
          ref={ref}
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
                <Fragment key={`prompt-message-${index}`}>
                  <PromptMessage
                    message={message}
                    prompt={prompt}
                    mode={mode}
                    index={index}
                    onChange={onChange}
                  />
                </Fragment>
              ))}
            </Stack>
          ) : null}
          <Completion completion={prompt.completion} chatMode />
        </Box>
      </Stack>
    );
  }
);

export default ChatPromptPlayground;
