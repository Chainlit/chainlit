import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import remarkGfm from 'remark-gfm';
import { Typography, Link, Stack } from '@mui/material';
import { IElements } from 'state/element';
import InlinedElements from '../../element/inlined';
import { memo } from 'react';
import { IAction } from 'state/action';
import ElementRef from './elementRef';
import Code from 'components/Code';

interface Props {
  id?: string;
  content?: string;
  elements: IElements;
  actions: IAction[];
  language?: string;
  authorIsUser?: boolean;
}

function prepareContent({ id, elements, actions, content, language }: Props) {
  const filteredElements = elements.filter((e) => {
    if (e.forId) {
      return e.forId === id;
    }
    return true;
  });

  const elementNames = filteredElements.map((e) => e.name);

  const elementRegexp = elementNames.length
    ? new RegExp(`(${elementNames.join('|')})`, 'g')
    : undefined;

  const filteredActions = actions.filter((v) => {
    if (v.forId) {
      return v.forId === id;
    }
    return true;
  });

  let preparedContent = content ? content.trim() : '';
  const inlinedElements: IElements = [];

  filteredElements.filter((e) => e.display === 'inline');

  if (elementRegexp) {
    preparedContent = preparedContent.replaceAll(elementRegexp, (match) => {
      const element = filteredElements.find((e) => e.name === match);
      if (!element) return match;

      if (element.display === 'inline') {
        inlinedElements.push(element);
      }
      // spaces break markdown links. The address in the link is not used anyway
      return `[${match}](${match.replaceAll(' ', '_')})`;
    });
  }

  if (language) {
    preparedContent = `\`\`\`${language}\n${preparedContent}\n\`\`\``;
  }
  return {
    preparedContent,
    inlinedElements,
    filteredElements,
    filteredActions
  };
}

export default memo(function MessageContent({
  id,
  content,
  elements,
  actions,
  language,
  authorIsUser
}: Props) {
  const {
    preparedContent,
    inlinedElements,
    filteredActions,
    filteredElements
  } = prepareContent({
    id,
    content,
    language,
    elements,
    actions
  });

  if (!preparedContent) return null;

  return (
    <Stack width="100%">
      <Typography
        sx={{
          width: '100%',
          minHeight: '20px',
          fontSize: '1rem',
          lineHeight: '1.5rem',
          fontFamily: 'Inter',
          fontWeight: authorIsUser ? 500 : 300
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          className="markdown-body"
          components={{
            a({ children, ...props }) {
              const name = children[0] as string;
              const element = filteredElements.find((e) => e.name === name);

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
            }
          }}
        >
          {preparedContent}
        </ReactMarkdown>
      </Typography>
      <InlinedElements inlined={inlinedElements} actions={filteredActions} />
    </Stack>
  );
});
