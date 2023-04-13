import {
  Box,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { Link as RRLink } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { INestedMessage } from "state/chat";
import { documentSideViewState, IDocuments } from "state/document";
import { playgroundState } from "state/playground";
import EditIcon from "@mui/icons-material/Edit";
import { getAgentColor } from "../agentAvatar";
import { useState } from "react";
import { renderDocument } from "components/document/view";
import FeedbackButtons from "components/chat/feedbackButtons";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import DetailsButton from "components/chat/detailsButton";
import Messages from "./messages";
import WaitForResponse from "../waitForResponse";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Props {
  message: INestedMessage;
  documents: IDocuments;
  indent: number;
  showAvatar?: boolean;
  isRunning?: boolean;
}

const authorBoxWidth = 70;

const Message = ({
  message,
  documents,
  indent,
  showAvatar,
  isRunning,
}: Props) => {
  const [hover, setHover] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const setPlayground = useSetRecoilState(playgroundState);
  const setSideView = useSetRecoilState(documentSideViewState);

  const documentNames = Object.keys(documents);
  const documentRegexp = documentNames.length
    ? new RegExp(`(${documentNames.join("|")})`, "g")
    : undefined;

  const editButton = message.prompt && (
    <IconButton
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

  let content = message.content.trim();

  if (documentRegexp) {
    content = content.replaceAll(documentRegexp, (match) => {
      return `[${match}](${match})`;
    });
  }

  if (message.language) {
    content = `\`\`\`${message.language}\n${content}\n\`\`\``;
  }

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
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          boxSizing: "border-box",
          mx: "auto",
          py: "10px",
          maxWidth: "55rem",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {hover && buttons}
        <Stack
          direction="row"
          mb={1}
          pl={indent ? `${indent * (authorBoxWidth + 16)}px` : 0}
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
                  lineHeight: "1.5rem",
                  textTransform: "uppercase",
                  color: getAgentColor(message.author),
                }}
              >
                {showAvatar && message.author}
              </Typography>
            </Tooltip>
          </Box>
          {!!message.indent && (
            <Box
              width="1px"
              bgcolor={getAgentColor(message.author)}
              mr={2}
              mt="4px"
            />
          )}
          <Stack alignItems="flex-start" flexGrow={1}>
            <Typography
              sx={{
                width: "100%",
                minHeight: "20px",
                fontSize: "1rem",
                lineHeight: "1.5rem",
                fontFamily: "Inter",
                marginTop: "-16px",
              }}
            >
              <ReactMarkdown
                components={{
                  a({ node, className, children, ...props }) {
                    const documentName = children[0] as string;
                    const document = documents[documentName];

                    if (!document) {
                      return (
                        <Link {...props} target="_blank">
                          {children}
                        </Link>
                      );
                    }

                    if (document.display === "inline") {
                      return renderDocument(document, true);
                    }

                    return (
                      <Link
                        className="document-link"
                        onClick={() => {
                          if (document.display === "side") {
                            setSideView(document);
                          }
                        }}
                        component={RRLink}
                        to={
                          document.display === "page"
                            ? `/document/${documentName}`
                            : "#"
                        }
                      >
                        {children}
                      </Link>
                    );
                  },
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <SyntaxHighlighter
                        {...props}
                        children={String(children).replace(/\n$/, "")}
                        style={a11yDark}
                        wrapLongLines
                        language={match[1]}
                        PreTag="div"
                      />
                    ) : (
                      <code {...props} className={className}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </Typography>
            <DetailsButton
              message={message}
              opened={showDetails}
              onClick={() => setShowDetails(!showDetails)}
              loading={isRunning}
            />
            {!isRunning && message.waitForAnswer && <WaitForResponse />}
          </Stack>
        </Stack>
      </Box>
      {message.subMessages && showDetails && (
        <Messages
          messages={message.subMessages}
          documents={documents}
          indent={indent + 1}
          isRunning={isRunning}
        />
      )}
    </Box>
  );
};

export default Message;
