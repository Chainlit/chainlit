import { keyframes } from '@emotion/react';
import { MessageContext } from 'contexts/MessageContext';
import { memo, useContext } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { useConfig } from '@chainlit/react-client';

import { AskUploadButton } from './components/AskUploadButton';
import { MessageAvatar } from './components/Avatar';
import { MessageActions } from './components/MessageActions';
import { MessageButtons } from './components/MessageButtons';
import { MessageContent } from './components/MessageContent';

import { useLayoutMaxWidth } from 'hooks/useLayoutMaxWidth';

import { type IAction, type IMessageElement, type IStep } from 'client-types/';

import { Messages } from './Messages';
import Step from './Step';
import UserMessage from './UserMessage';

interface Props {
  message: IStep;
  elements: IMessageElement[];
  actions: IAction[];
  indent: number;
  isRunning?: boolean;
  isScorable?: boolean;
  scorableRun?: IStep;
}

const Message = memo(
  ({
    message,
    elements,
    actions,
    isRunning,
    indent,
    isScorable,
    scorableRun
  }: Props) => {
    const {
      highlightedMessage,
      defaultCollapseContent,
      allowHtml,
      latex,
      onError
    } = useContext(MessageContext);
    const { config } = useConfig();
    const layoutMaxWidth = useLayoutMaxWidth();
    const isAsk = message.waitForAnswer;
    const isUserMessage = message.type === 'user_message';
    const isStep = !message.type.includes('message');
    // Only keep tool calls if Chain of Thought is tool_call
    const toolCallSkip =
      isStep && config?.ui.cot === 'tool_call' && message.type !== 'tool';

    const hiddenSkip = isStep && config?.ui.cot === 'hidden';

    const skip = toolCallSkip || hiddenSkip;

    if (skip) {
      if (!message.steps) {
        return null;
      }
      return (
        <Messages
          messages={message.steps}
          elements={elements}
          actions={actions}
          indent={indent}
          isRunning={isRunning}
          scorableRun={scorableRun}
        />
      );
    }

    return (
      <>
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
              width: '100%',
              maxWidth: indent ? '100%' : layoutMaxWidth,
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
                pb: indent ? 1 : 2,
                flexGrow: 1,
                animation:
                  message.id && highlightedMessage === message.id
                    ? `3s ease-in-out 0.1s ${flash}`
                    : 'none'
              }}
            >
              {/* User message is displayed differently */}
              {isUserMessage ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  flexGrow={1}
                  maxWidth={'100%'}
                >
                  <UserMessage message={message}>
                    <MessageContent
                      elements={elements}
                      message={message}
                      preserveSize={
                        !!message.streaming || !defaultCollapseContent
                      }
                      allowHtml={allowHtml}
                      latex={latex}
                    />
                  </UserMessage>
                </Box>
              ) : (
                <Stack
                  direction="row"
                  gap="1rem"
                  width="100%"
                  className="ai-message"
                >
                  {!isStep || !indent ? (
                    <MessageAvatar author={message.name} />
                  ) : null}
                  {/* Display the step and its children */}
                  {isStep ? (
                    <Step step={message} isRunning={isRunning}>
                      {message.steps ? (
                        <Messages
                          messages={message.steps.filter(
                            (s) => !s.type.includes('message')
                          )}
                          elements={elements}
                          actions={actions}
                          indent={indent + 1}
                          isRunning={isRunning}
                        />
                      ) : null}
                      <MessageContent
                        elements={elements}
                        message={message}
                        preserveSize={
                          !!message.streaming || !defaultCollapseContent
                        }
                        allowHtml={allowHtml}
                        latex={latex}
                      />
                      {actions?.length ? (
                        <MessageActions message={message} actions={actions} />
                      ) : null}
                      <MessageButtons message={message} />
                    </Step>
                  ) : (
                    // Display an assistant message
                    <Stack
                      alignItems="flex-start"
                      minWidth={150}
                      flexGrow={1}
                      position="relative"
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
                      {!isRunning && isAsk && (
                        <AskUploadButton onError={onError} />
                      )}
                      {actions?.length ? (
                        <MessageActions message={message} actions={actions} />
                      ) : null}
                      <MessageButtons
                        message={message}
                        run={
                          scorableRun && isScorable ? scorableRun : undefined
                        }
                      />
                    </Stack>
                  )}
                </Stack>
              )}
            </Stack>
          </Box>
        </Box>
        {/* Make sure the child assistant messages of a step are displayed at the root level. */}
        {message.steps && isStep ? (
          <Messages
            messages={message.steps.filter((s) => s.type.includes('message'))}
            elements={elements}
            actions={actions}
            indent={0}
            isRunning={isRunning}
            scorableRun={scorableRun}
          />
        ) : null}
        {/* Display the child steps if the message is not a step (usually a user message). */}
        {message.steps && !isStep ? (
          <Messages
            messages={message.steps}
            elements={elements}
            actions={actions}
            indent={indent}
            isRunning={isRunning}
          />
        ) : null}
      </>
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
