import { keyframes } from '@emotion/react';
import { MessageContext } from 'contexts/MessageContext';
import { memo, useContext, useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { AskUploadButton } from './components/AskUploadButton';
import { Author } from './components/Author';
import { DetailsButton } from './components/DetailsButton';
import { MessageActions } from './components/MessageActions';
import { MessageButtons } from './components/MessageButtons';
import { MessageContent } from './components/MessageContent';

import { useLayoutMaxWidth } from 'hooks/useLayoutMaxWidth';

import type { IAction, IMessageElement, IStep } from 'client-types/';

import BlinkingCursor from '../BlinkingCursor';
import { Messages } from './Messages';

interface Props {
  message: IStep;
  elements: IMessageElement[];
  actions: IAction[];
  indent: number;
  showAvatar?: boolean;
  showBorder?: boolean;
  isRunning?: boolean;
  isLast?: boolean;
}

const Message = memo(
  ({
    message,
    elements,
    actions,
    indent,
    showAvatar,
    showBorder,
    isRunning,
    isLast
  }: Props) => {
    const {
      expandAll,
      hideCot,
      highlightedMessage,
      defaultCollapseContent,
      allowHtml,
      latex,
      onError
    } = useContext(MessageContext);
    const layoutMaxWidth = useLayoutMaxWidth();

    const [showDetails, setShowDetails] = useState(expandAll);

    useEffect(() => {
      setShowDetails(expandAll);
    }, [expandAll]);

    if (hideCot && indent) {
      return null;
    }

    const isAsk = message.waitForAnswer;
    const isUserMessage = message.type === 'user_message';

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
              py: 2,
              borderBottom: (theme) =>
                showBorder ? `1px solid ${theme.palette.divider}` : 'none',
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
                    py: 1,
                    borderRadius: '1.5rem',
                    backgroundColor: 'background.paper',
                    maxWidth: '90%',
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
                <DetailsButton
                  message={message}
                  opened={showDetails}
                  onClick={() => setShowDetails(!showDetails)}
                  loading={isRunning && isLast}
                />
                {message.steps && showDetails && (
                  <Messages
                    messages={message.steps}
                    actions={actions}
                    elements={elements}
                    indent={indent + 1}
                    isRunning={isRunning}
                  />
                )}
              </Box>
            ) : (
              <Author message={message} show={showAvatar}>
                <DetailsButton
                  message={message}
                  opened={showDetails}
                  onClick={() => setShowDetails(!showDetails)}
                  loading={isRunning && isLast}
                />
                {message.steps && showDetails && (
                  <Messages
                    messages={message.steps}
                    actions={actions}
                    elements={elements}
                    indent={indent + 1}
                    isRunning={isRunning}
                  />
                )}
                <Stack alignItems="flex-start" minWidth={150}>
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
                </Stack>
              </Author>
            )}
          </Stack>
          {isLast &&
            isRunning &&
            (!message.streaming || window.renderingCodeBlock) && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -5,
                  left: 38,
                  boxSizing: 'border-box',
                  mx: 'auto',
                  maxWidth: layoutMaxWidth,
                  px: 2,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <BlinkingCursor />
              </Box>
            )}
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
