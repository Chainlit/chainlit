import { Box, IconButton, Link, Stack, Typography } from "@mui/material";
import { Link as RRLink } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { IMessage } from "state/chat";
import { documentSideViewState, IDocuments } from "state/document";
import { playgroundState } from "state/playground";
import EditIcon from "@mui/icons-material/Edit";
import { getAgentColor } from "./agentAvatar";
import { useState } from "react";
import { renderDocument } from "components/document/view";
import { CodeBlock, dracula } from "react-code-blocks";
import FeedbackButtons from "./feedbackButtons";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";

interface Props {
  message: IMessage;
  documents: IDocuments;
  showAvatar?: boolean;
  isLast?: boolean;
}

const Message = ({ message, documents, showAvatar, isLast }: Props) => {
  const [hover, setHover] = useState(false);
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
      {message.final && message.id && <FeedbackButtons message={message} />}
    </Stack>
  );

  const content = message.content.trim();

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
          borderBottom: (theme) =>
            isLast ? undefined : `1px solid ${theme.palette.divider}`,
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
        <Stack direction="row" mb={1}>
          <Box width="100px" pr={2}>
            <Typography
              noWrap
              sx={{
                width: "100px",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: ".08em",
                lineHeight: "1.5rem",
                textTransform: "uppercase",
                color: getAgentColor(message.author),
              }}
            >
              {showAvatar && message.author}
            </Typography>
          </Box>
          <Stack
            alignItems="center"
            spacing={1}
            sx={{
              pl: (message.indent || 0) * 2,
            }}
          >
            {/* {showAvatar && <Box width="5px" height="5px" borderRadius="50%" bgcolor={getAgentColor(message.author)} />} */}
            {!!message.indent && (
              <Box
                width="1px"
                flexGrow={1}
                bgcolor={getAgentColor(message.author)}
                mr={2}
                mt="4px"
              />
            )}
          </Stack>
          <Typography
            sx={{
              flexGrow: 1,
              minHeight: "20px",
              fontSize: "1rem",
              lineHeight: "1.5rem",
              fontFamily: "Inter",
              marginTop: message.language ? 0 : "-16px",
            }}
          >
            {!message.language && !documentRegexp && (
              <ReactMarkdown>{content}</ReactMarkdown>
            )}
            {!message.language && documentRegexp && (
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
                }}
              >
                {content.replaceAll(documentRegexp, (match) => {
                  return `[${match}](${match})`;
                })}
              </ReactMarkdown>
            )}

            {message.language && (
              <CodeBlock
                text={content}
                language={message.language}
                showLineNumbers={false}
                theme={dracula}
                wrapLongLines
              />
            )}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
};

export default Message;
