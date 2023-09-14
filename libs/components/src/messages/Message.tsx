import { keyframes } from '@emotion/react';
import { MessageContext } from 'contexts/MessageContext';
import { useContext, useEffect, useState } from 'react';

import { Box, Stack } from '@mui/material';

import { AskUploadButton } from './components/AskUploadButton';
import { AUTHOR_BOX_WIDTH, Author } from './components/Author';
import { Buttons } from './components/Buttons';
import { DetailsButton } from './components/DetailsButton';
import { MessageContent } from './components/MessageContent';

import { IAction } from 'src/types/action';
import { IMessageElement } from 'src/types/element';
import { INestedMessage } from 'src/types/message';

import { Messages } from './Messages';

interface Props {
  message: INestedMessage;
  elements: IMessageElement[];
  actions: IAction[];
  indent: number;
  showAvatar?: boolean;
  showBorder?: boolean;
  isRunning?: boolean;
  isLast?: boolean;
}

const Message = ({
  message,
  elements,
  actions,
  indent,
  showAvatar,
  showBorder,
  isRunning,
  isLast
}: Props) => {
  const messageContext = useContext(MessageContext);
  const [showDetails, setShowDetails] = useState(messageContext.expandAll);

  useEffect(() => {
    setShowDetails(messageContext.expandAll);
  }, [messageContext.expandAll]);

  if (messageContext.hideCot && indent) {
    return null;
  }

  return (
    <Box
      sx={{
        color: 'text.primary',
        backgroundColor: 'transparent'
      }}
      className="message"
    >
      <Box
        sx={{
          boxSizing: 'border-box',
          mx: 'auto',
          maxWidth: '60rem',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        <Stack
          id={`message-${message.id}`}
          direction="row"
          ml={indent ? `${indent * (AUTHOR_BOX_WIDTH + 16)}px` : 0}
          sx={{
            py: 2,
            borderBottom: (theme) =>
              showBorder ? `1px solid ${theme.palette.divider}` : 'none',
            animation:
              message.id && messageContext.highlightedMessage === message.id
                ? `3s ease-in-out 0.1s ${flash}`
                : 'none'
          }}
        >
          <Author message={message} show={showAvatar} />
          <Stack
            alignItems="flex-start"
            width={0}
            flexGrow={1}
            spacing={1}
            minWidth={200}
          >
            <MessageContent
              authorIsUser={message.authorIsUser}
              elements={elements}
              id={message.id}
              content={message.content}
              language={message.language}
              preserveSize={
                !!message.streaming || !messageContext.defaultCollapseContent
              }
            />
            <DetailsButton
              message={message}
              opened={showDetails}
              onClick={() => setShowDetails(!showDetails)}
              loading={isRunning}
            />
            {!isRunning && isLast && message.waitForAnswer && (
              <AskUploadButton />
            )}
            <Buttons message={message} actions={actions} />
          </Stack>
        </Stack>
      </Box>
      {message.subMessages && showDetails && (
        <Messages
          messages={message.subMessages}
          actions={actions}
          elements={elements}
          indent={indent + 1}
          isRunning={isRunning}
        />
      )}
    </Box>
  );
};

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
