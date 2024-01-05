import { keyframes } from '@emotion/react';
import { MessageContext } from 'contexts/MessageContext';
import { memo, useContext, useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { AskUploadButton } from './components/AskUploadButton';
import { AUTHOR_BOX_WIDTH, Author } from './components/Author';
import { DetailsButton } from './components/DetailsButton';
import { MessageActions } from './components/MessageActions';
import { MessageButtons } from './components/MessageButtons';
import { MessageContent } from './components/MessageContent';

import type { IAction, IMessageElement, IStep } from 'client-types/';

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

    const [showDetails, setShowDetails] = useState(expandAll);

    useEffect(() => {
      setShowDetails(expandAll);
    }, [expandAll]);

    if (hideCot && indent) {
      return null;
    }

    const isUser = message.type === 'user_message';
    const isAsk = message.waitForAnswer;

    return (
      <Box
        sx={{
          color: 'text.primary',
          backgroundColor: (theme) =>
            isUser
              ? 'transparent'
              : theme.palette.mode === 'dark'
              ? theme.palette.grey[800]
              : theme.palette.grey[100]
        }}
        className="step"
      >
        <Box
          sx={{
            boxSizing: 'border-box',
            mx: 'auto',
            maxWidth: '60rem',
            px: 2,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}
        >
          <Stack
            id={`step-${message.id}`}
            direction="row"
            ml={indent ? `${indent * (AUTHOR_BOX_WIDTH + 12)}px` : 0}
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
            <Author message={message} show={showAvatar}>
              <Stack alignItems="flex-start" minWidth={150}>
                <MessageContent
                  elements={elements}
                  message={message}
                  preserveSize={!!message.streaming || !defaultCollapseContent}
                  allowHtml={allowHtml}
                  latex={latex}
                />
                <DetailsButton
                  message={message}
                  opened={showDetails}
                  onClick={() => setShowDetails(!showDetails)}
                  loading={isRunning && isLast}
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
          </Stack>
        </Box>
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
