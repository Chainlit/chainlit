import { Box, Link } from '@mui/material';
import { useRecoilValue } from 'recoil';
import { projectSettingsState } from 'state/project';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import Code from 'components/Code';

const WelcomeScreen = () => {
  const pSettings = useRecoilValue(projectSettingsState);

  return (
    <Box overflow="auto">
      <Box
        id="welcome-screen"
        sx={{
          maxWidth: '60rem',
          width: '100%',
          m: 'auto',
          color: 'text.primary',
          lineHeight: '25px',
          fontSize: '1rem',
          fontFamily:
            '-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {pSettings?.chainlitMd ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a({ children, ...props }) {
                return (
                  <Link {...props} target="_blank">
                    {children}
                  </Link>
                );
              },
              code({ inline, className, children, ...props }) {
                console.log(inline);
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    {...props}
                    children={String(children).replace(/\n$/, '')}
                    style={a11yDark}
                    wrapLongLines
                    language={match[1]}
                    PreTag="div"
                  />
                ) : (
                  <Code
                    inline={inline}
                    className={className}
                    children={children}
                    {...props}
                  />
                );
              }
            }}
          >
            {pSettings?.chainlitMd}
          </ReactMarkdown>
        ) : null}
      </Box>
    </Box>
  );
};

export default WelcomeScreen;
