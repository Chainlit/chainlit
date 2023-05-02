import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { useSetRecoilState } from "recoil";
import { INestedMessage } from "state/chat";
import { IElements } from "state/element";
import { playgroundState } from "state/playground";
import EditIcon from "@mui/icons-material/Edit";
import { useState } from "react";
import FeedbackButtons from "components/chat/message/feedbackButtons";
import DetailsButton from "components/chat/message/detailsButton";
import Messages from "./messages";
import MessageContent from "./content";
import { getAuthorColor } from "helpers/color";
import UploadButton from "./uploadButton";
import MessageTime from "./time";
import { IActions } from "state/action";

interface Props {
  message: INestedMessage;
  elements: IElements;
  actions: IActions;
  indent: number;
  showAvatar?: boolean;
  showBorder?: boolean;
  isRunning?: boolean;
  isLast?: boolean;
}

const authorBoxWidth = 70;

const Message = ({
  message,
  elements,
  actions,
  indent,
  showAvatar,
  showBorder,
  isRunning,
  isLast,
}: Props) => {
  const [hover, setHover] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const setPlayground = useSetRecoilState(playgroundState);

  const editButton = message.prompt && (
    <IconButton
      id="playground-button"
      color="primary"
      onClick={() => {
        setPlayground({
          llmSettings: message.llmSettings!,
          prompt: message.prompt!,
          completion: message.content,
        });
      }}
    >
      <EditIcon sx={{ width: "16px", height: "16px" }} />
    </IconButton>
  );

  const buttons = (
    <Stack
      direction="row"
      sx={{
        position: "absolute",
        top: 0,
        right: 0,
        zIndex: 10,
        transform: "translateX(100%)",
      }}
    >
      {editButton}
      {message.id && !message.authorIsUser && (
        <FeedbackButtons message={message} />
      )}
    </Stack>
  );

  return (
    <Box
      sx={{
        color: "text.primary",
        backgroundColor: "transparent",
      }}
      className="message"
      onMouseEnter={(e) => setHover(true)}
      onMouseLeave={(e) => setHover(false)}
    >
      <Box
        sx={{
          boxSizing: "border-box",
          mx: "auto",
          maxWidth: "60rem",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {hover && buttons}
        <Stack
          direction="row"
          ml={indent ? `${indent * (authorBoxWidth + 16)}px` : 0}
          sx={{
            py: 2,
            borderBottom: (theme) =>
              showBorder ? `1px solid ${theme.palette.divider}` : "none",
          }}
        >
          <Box width={authorBoxWidth} pr={2}>
            <Tooltip title={message.author}>
              <Typography
                noWrap
                sx={{
                  width: authorBoxWidth,
                  fontSize: "12.5px",
                  fontWeight: 500,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  color: getAuthorColor(message.author),
                }}
              >
                {showAvatar && message.author}
              </Typography>
            </Tooltip>
            <MessageTime timestamp={message.createdAt} />
          </Box>
          {!!message.indent && (
            <Box
              width="1px"
              mr={2}
              borderLeft={`1px solid ${getAuthorColor(message.author)}`}
            />
          )}
          <Stack alignItems="flex-start" flexGrow={1} spacing={1}>
            <MessageContent
              actions={actions}
              elements={elements}
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
