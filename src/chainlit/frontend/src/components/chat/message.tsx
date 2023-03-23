import { Box, IconButton, Link, Stack, Typography } from "@mui/material";
import { Link as RRLink } from "react-router-dom";
import reactStringReplace from "react-string-replace";
import { useRecoilValue, useSetRecoilState } from "recoil";
import {
  documentSideViewState,
  documentsState,
  IMessage,
  playgroundState,
} from "state/chat";
import { Edit, ThumbDown, ThumbUp } from "@mui/icons-material";
import AgentAvatar, { getAgentColor } from "./agentAvatar";
import { useState } from "react";
import { renderDocument } from "components/artifact/view";
import { CodeBlock, dracula } from "react-code-blocks";
import ReactMarkdown from "react-markdown";

interface Props {
  message: IMessage;
  showAvatar?: boolean;
}

const Message = ({ message, showAvatar }: Props) => {
  const [hover, setHover] = useState(false);
  const documents = useRecoilValue(documentsState);
  const setPlayground = useSetRecoilState(playgroundState);
  const setSideView = useSetRecoilState(documentSideViewState);

  const documentNames = Object.keys(documents);
  const documentRegexp = documentNames.length
    ? new RegExp(`(${documentNames.join("|")})`)
    : undefined;

  const editButton = message.prompt && !message.final && (
    <IconButton
      color="primary"
      onClick={() =>
        setPlayground({
          llmSettings: message.llm_settings!,
          prompt: message.prompt!,
          completion: message.content,
        })
      }
    >
      <Edit sx={{ width: "16px", height: "16px" }} />
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
      {message.final && (
        <IconButton>
          <ThumbUp sx={{ width: "16px", height: "16px" }} />
        </IconButton>
      )}
      {message.final && (
        <IconButton>
          <ThumbDown sx={{ width: "16px", height: "16px" }} />
        </IconButton>
      )}
    </Stack>
  );

  return (
    <Box
      sx={{
        color: "text.primary",
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => setHover(true)}
      onMouseLeave={(e) => setHover(false)}
    >
      <Box
        sx={{
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          // px: 2,
          boxSizing: "border-box",
          mx: "auto",
          py: "10px",
          maxWidth: "48rem",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {hover && buttons}
        <Stack direction="row" mb={1}>
          <Box width="100px">
           
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
              whiteSpace: "pre-wrap",
              minHeight: "20px",
              fontSize: "1rem",
              lineHeight: "1.5rem",
              fontFamily: "Inter",
            }}
          >
            {!message.language &&
              reactStringReplace(
                message.content.trim(),
                documentRegexp,
                (match, i) => (
                  <Link
                    key={i}
                    onClick={() => {
                      if (documents[match].spec.display === "side") {
                        setSideView(documents[match]);
                      }
                    }}
                    component={RRLink}
                    to={
                      documents[match].spec.display === "fullscreen"
                        ? `/document/${match}`
                        : "#"
                    }
                  >
                    {documents[match].spec.display === "embed"
                      ? renderDocument(documents[match], true)
                      : match}
                  </Link>
                )
              )}

            {message.language && (
              <CodeBlock
                text={message.content.trim()}
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
