import { memo } from 'react';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import remarkGfm from 'remark-gfm';
import { Code } from 'src/Code';
import { Collapse } from 'src/Collapse';
import { InlinedElements } from 'src/elements/InlinedElements';
import { exportToFile } from 'utils/exportToFile';
import { prepareContent } from 'utils/message';

import {
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

import { IMessageContent } from 'src/types/message';

import { ElementRef } from './ElementRef';

const COLLAPSE_MIN_LINES = 25; // Set this to the maximum number of lines you want to display before collapsing
const COLLAPSE_MIN_LENGTH = 3000; // Set this to the maximum number of characters you want to display before collapsing

const MessageContent = memo(
  ({
    id,
    content,
    elements,
    language,
    authorIsUser,
    preserveSize
  }: IMessageContent) => {
    const { preparedContent, inlinedElements, refElements } = prepareContent({
      id,
      content,
      language,
      elements
    });

    if (!preparedContent) return null;

    const renderContent = () => (
      <Stack direction="row">
        <Typography
          sx={{
            width: '100%',
            minHeight: '20px',
            fontSize: '1rem',
            lineHeight: '1.5rem',
            fontFamily: 'Inter',
            fontWeight: authorIsUser ? 500 : 300
          }}
          component="div"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className="markdown-body"
            components={{
              a({ children, ...props }) {
                const name = children[0] as string;
                const element = refElements.find((e) => e.name === name);

                if (element) {
                  return <ElementRef element={element} />;
                } else {
                  return (
                    <Link {...props} target="_blank">
                      {children}
                    </Link>
                  );
                }
              },
              code({ ...props }) {
                return <Code {...props} />;
              },
              table({ children, ...props }) {
                return (
                  <TableContainer
                    sx={{
                      width: 'fit-content',
                      minWidth: '300px',
                      margin: 1
                    }}
                    elevation={0}
                    component={Paper}
                  >
                    <Table {...props}>{children}</Table>
                  </TableContainer>
                );
              },
              thead({ children, ...props }) {
                return <TableHead {...props}>{children}</TableHead>;
              },
              tr({ children, ...props }) {
                return <TableRow {...props}>{children}</TableRow>;
              },
              th({ children, ...props }) {
                return (
                  <TableCell {...props} align="right" sx={{ padding: 1 }}>
                    {children}
                  </TableCell>
                );
              },
              td({ children, ...props }) {
                return (
                  <TableCell {...props} align="right" sx={{ padding: 1 }}>
                    {children}
                  </TableCell>
                );
              },
              tbody({ children, ...props }) {
                return <TableBody {...props}>{children}</TableBody>;
              }
            }}
          >
            {preparedContent}
          </ReactMarkdown>
        </Typography>
      </Stack>
    );

    const lineCount = preparedContent.split('\n').length;
    const collapse =
      lineCount > COLLAPSE_MIN_LINES ||
      preparedContent.length > COLLAPSE_MIN_LENGTH;

    return (
      <Stack width="100%">
        {collapse ? (
          <Collapse
            defaultExpandAll={preserveSize}
            onDownload={() => exportToFile(preparedContent, `${id}.txt`)}
          >
            {renderContent()}
          </Collapse>
        ) : (
          renderContent()
        )}
        <InlinedElements elements={inlinedElements} />
      </Stack>
    );
  }
);

export { MessageContent };
