import { exportToFile } from 'helpers/export';
import { memo } from 'react';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import remarkGfm from 'remark-gfm';

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

import { IMessageElement } from '@chainlit/components';

import Code from 'components/atoms/Code';
import Collapse from 'components/atoms/Collapse';
import ElementRef from 'components/atoms/element/ref';

import InlinedElements from './inlined';

const COLLAPSE_MIN_LINES = 25; // Set this to the maximum number of lines you want to display before collapsing
const COLLAPSE_MIN_LENGTH = 3000; // Set this to the maximum number of characters you want to display before collapsing

interface Props {
  id?: string;
  content?: string;
  elements: IMessageElement[];
  language?: string;
  authorIsUser?: boolean;
  preserveSize?: boolean;
}

const isForIdMatch = (
  id: string | number | undefined,
  forIds: string[] | undefined
) => {
  if (!forIds || !forIds.length || !id) {
    return false;
  }

  return forIds.includes(id.toString());
};

const isGlobalMatch = (forIds: string[] | undefined) => {
  return !forIds || !forIds.length;
};

function escapeRegExp(string: string) {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function prepareContent({ id, elements, content, language }: Props) {
  const elementNames = elements.map((e) => escapeRegExp(e.name));

  // Sort by descending length to avoid matching substrings
  elementNames.sort((a, b) => b.length - a.length);

  const elementRegexp = elementNames.length
    ? new RegExp(`(${elementNames.join('|')})`, 'g')
    : undefined;

  let preparedContent = content ? content.trim() : '';
  const inlinedElements = elements.filter(
    (e) => isForIdMatch(id, e?.forIds) && e.display === 'inline'
  );
  const refElements: IMessageElement[] = [];

  if (elementRegexp) {
    preparedContent = preparedContent.replaceAll(elementRegexp, (match) => {
      const element = elements.find((e) => {
        const nameMatch = e.name === match;
        const scopeMatch =
          isGlobalMatch(e?.forIds) || isForIdMatch(id, e?.forIds);
        return nameMatch && scopeMatch;
      });
      const foundElement = !!element;

      const inlined = element?.display === 'inline';
      if (!foundElement) {
        // Element reference does not exist, return plain text
        return match;
      } else if (inlined) {
        // If element is inlined, add it to the list and return plain text
        if (inlinedElements.indexOf(element) === -1) {
          inlinedElements.push(element);
        }
        return match;
      } else {
        // Element is a reference, add it to the list and return link
        refElements.push(element);
        // spaces break markdown links. The address in the link is not used anyway
        return `[${match}](${match.replaceAll(' ', '_')})`;
      }
    });
  }

  if (language) {
    preparedContent = `\`\`\`${language}\n${preparedContent}\n\`\`\``;
  }
  return {
    preparedContent,
    inlinedElements,
    refElements
  };
}

export default memo(function MessageContent({
  id,
  content,
  elements,
  language,
  authorIsUser,
  preserveSize
}: Props) {
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
});
