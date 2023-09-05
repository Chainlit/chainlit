import { keyframes } from '@emotion/react';
import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';

import { Box, Stack } from '@mui/material';

import { IMessageElement } from '@chainlit/components';

import { highlightMessage } from 'state/chat';
import { settingsState } from 'state/settings';

import { IAction } from 'types/action';
import { INestedMessage } from 'types/chat';

import AskUploadButton from './AskUploadButton';
import Author, { authorBoxWidth } from './author';
import Buttons from './buttons';
import MessageContent from './content';
import DetailsButton from './detailsButton';
import Messages from './messages';

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
  const appSettings = useRecoilValue(settingsState);
  const highlightedMessage = useRecoilValue(highlightMessage);
  const [showDetails, setShowDetails] = useState(appSettings.expandAll);

  useEffect(() => {
    setShowDetails(appSettings.expandAll);
  }, [appSettings.expandAll]);

  if (appSettings.hideCot && indent) {
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
          ml={indent ? `${indent * (authorBoxWidth + 16)}px` : 0}
          sx={{
            py: 2,
            borderBottom: (theme) =>
              showBorder ? `1px solid ${theme.palette.divider}` : 'none',
            animation:
              message.id && highlightedMessage === message.id
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
                !!message.streaming || !appSettings.defaultCollapseContent
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

export default Message;
