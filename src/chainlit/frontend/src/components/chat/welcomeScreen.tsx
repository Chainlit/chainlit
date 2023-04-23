import { Box, Link } from "@mui/material";
import { useRecoilValue } from "recoil";
import { projectSettingsState } from "state/project";
import { LogoFull } from "components/logo";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

const WelcomeScreen = () => {
  const pSettings = useRecoilValue(projectSettingsState);

  return (
    <Box
      id="welcome-screen"
      flexGrow={1}
      sx={{
        maxWidth: "55rem",
        maxHeight: "100%",
        overflowY: "scroll",
        width: "100%",
        m: "auto",
        color: "text.primary",
        lineHeight: "25px",
        fontSize: "1rem",
        fontFamily:
          "-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji",
        display: pSettings?.chainlitMd ? "block" : "flex",
      }}
    >
      {pSettings?.chainlitMd ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a({ node, className, children, ...props }) {
              return (
                <Link {...props} target="_blank">
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
          {pSettings?.chainlitMd}
        </ReactMarkdown>
      ) : (
        <LogoFull />
      )}
    </Box>
  );
};

export default WelcomeScreen;
