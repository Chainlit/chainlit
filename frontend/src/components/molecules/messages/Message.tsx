import { keyframes } from '@emotion/react';
import { MessageContext } from 'contexts/MessageContext';
import { memo, useContext } from 'react';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

import { AskUploadButton } from './components/AskUploadButton';
import { MessageAvatar } from './components/Avatar';
import { MessageActions } from './components/MessageActions';
import { MessageButtons } from './components/MessageButtons';
import { MessageContent } from './components/MessageContent';

import { useLayoutMaxWidth } from 'hooks/useLayoutMaxWidth';

import type { IAction, IMessageElement, IStep } from 'client-types/';

import BlinkingCursor from '../BlinkingCursor';
import ToolCalls from './ToolCalls';

interface Props {
  message: IStep;
  showAvatar?: boolean;
  elements: IMessageElement[];
  actions: IAction[];
  indent: number;
  isRunning?: boolean;
  isLast?: boolean;
}

const Message = memo(
  ({ message, showAvatar, elements, actions, isRunning, isLast }: Props) => {
    const {
      highlightedMessage,
      defaultCollapseContent,
      allowHtml,
      latex,
      onError
    } = useContext(MessageContext);
    const layoutMaxWidth = useLayoutMaxWidth();

    const isAsk = message.waitForAnswer;
    const isUserMessage = message.type === 'user_message';

    const forceDisplayCursor = isLast && isRunning && !message.streaming;
    return (
      <Box
        sx={{
          color: 'text.primary',
          position: 'relative'
        }}
        className="step"
      >
        <Box
          sx={{
            boxSizing: 'border-box',
            mx: 'auto',
            maxWidth: layoutMaxWidth,
            px: 2,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}
        >
          <Stack
            id={`step-${message.id}`}
            direction="row"
            sx={{
              pb: 2,
              animation:
                message.id && highlightedMessage === message.id
                  ? `3s ease-in-out 0.1s ${flash}`
                  : 'none',
              overflowX: 'auto'
            }}
          >
            {isUserMessage ? (
              <Box display="flex" flexDirection="column" width="100%">
                <Box
                  sx={{
                    px: 2.5,
                    borderRadius: '1.5rem',
                    backgroundColor: 'background.paper',
                    maxWidth: '70%',
                    ml: 'auto'
                  }}
                >
                  <MessageContent
                    elements={elements}
                    message={message}
                    preserveSize={
                      !!message.streaming || !defaultCollapseContent
                    }
                    allowHtml={allowHtml}
                    latex={latex}
                  />
                </Box>
                {forceDisplayCursor && (
                  <Stack
                    direction="row"
                    gap="1rem"
                    alignItems="center"
                    my={0.5}
                    width="100%"
                  >
                    <Skeleton
                      variant="circular"
                      width="1.6rem"
                      height="1.6rem"
                    />
                    <BlinkingCursor />
                  </Stack>
                )}
              </Box>
            ) : (
              <Stack
                direction="row"
                gap="1rem"
                width="100%"
                className="ai-message"
              >
                <MessageAvatar author={message.name} hide={!showAvatar} />
                <Stack
                  alignItems="flex-start"
                  minWidth={150}
                  flexGrow={1}
                  position="relative"
                >
                  <ToolCalls
                    elements={elements}
                    message={message}
                    isRunning={isRunning}
                  />
                  <MessageContent
                    elements={elements}
                    message={message}
                    preserveSize={
                      !!message.streaming || !defaultCollapseContent
                    }
                    allowHtml={allowHtml}
                    latex={latex}
                  />
                  {!isRunning && isLast && isAsk && (
                    <AskUploadButton onError={onError} />
                  )}
                  {actions?.length ? (
                    <MessageActions message={message} actions={actions} />
                  ) : null}
                  <MessageButtons message={message} />
                  {forceDisplayCursor && (
                    <Box my={0.5}>
                      <BlinkingCursor />
                    </Box>
                  )}
                </Stack>
              </Stack>
            )}
          </Stack>
        </Box>
      </Box>
    );
  }
);

// Uses yellow[500] with 50% opacity
const flash = keyframes`
  from {
    background-color: transparent;
  }
  25% {
    background-color: rgba(255, 173, 51, 0.5);
  }
  to {
    background-color: transparent;
  }
`;

export { Message };
