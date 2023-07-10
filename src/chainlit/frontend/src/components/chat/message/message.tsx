import { keyframes } from '@emotion/react';
import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';

import { Box, Stack } from '@mui/material';

import DetailsButton from 'components/chat/message/detailsButton';

import { IAction } from 'state/action';
import { INestedMessage, highlightMessage } from 'state/chat';
import { IElements } from 'state/element';
import { settingsState } from 'state/settings';

import Author, { authorBoxWidth } from './author';
import Buttons from './buttons';
import MessageContent from './content';
import Messages from './messages';
import UploadButton from './uploadButton';

interface Props {
  message: INestedMessage;
  elements: IElements;
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

  const messageId = message.id ? message.id.toString() : message.tempId;

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
          id={`message-${messageId}`}
          direction="row"
          ml={indent ? `${indent * (authorBoxWidth + 16)}px` : 0}
          sx={{
            py: 2,
            borderBottom: (theme) =>
              showBorder ? `1px solid ${theme.palette.divider}` : 'none',
            animation:
              highlightedMessage === messageId
                ? `3s ease-in-out 0.1s ${flash}`
                : 'none'
          }}
        >
          <Author message={message} show={showAvatar} />
          <Stack alignItems="flex-start" width={0} flexGrow={1} spacing={1}>
            <MessageContent
              authorIsUser={message.authorIsUser}
              actions={actions}
              elements={elements}
              id={messageId}
              content={message.content}
              language={message.language}
            />
            <DetailsButton
              message={message}
              opened={showDetails}
              onClick={() => setShowDetails(!showDetails)}
              loading={isRunning}
            />
            {!isRunning && isLast && message.waitForAnswer && <UploadButton />}
            <Buttons message={message} />
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
