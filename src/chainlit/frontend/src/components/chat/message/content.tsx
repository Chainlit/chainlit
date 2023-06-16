import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import remarkGfm from 'remark-gfm';
import { Typography, Link, Stack } from '@mui/material';
import { IElements } from 'state/element';
import { memo } from 'react';
import { IAction } from 'state/action';
import ElementRef from 'components/element/ref';
import Code from 'components/Code';
import InlinedElements from './inlined';

interface Props {
  id?: string;
  content?: string;
  elements: IElements;
  actions: IAction[];
  language?: string;
  authorIsUser?: boolean;
}

function prepareContent({ id, elements, actions, content, language }: Props) {
  const elementNames = elements.map((e) => e.name);

  // Sort by descending length to avoid matching substrings
  elementNames.sort((a, b) => b.length - a.length);

  const elementRegexp = elementNames.length
    ? new RegExp(`(${elementNames.join('|')})`, 'g')
    : undefined;

  const scopedActions = actions.filter((a) => {
    if (a.forId) {
      return a.forId === id;
    }
    return true;
  });

  let preparedContent = content ? content.trim() : '';
  const inlinedElements: IElements = elements.filter(
    (e) => e.forId === id && e.display === 'inline'
  );
  const refElements: IElements = [];

  if (elementRegexp) {
    preparedContent = preparedContent.replaceAll(elementRegexp, (match) => {
      const element = elements.find((e) => {
        const nameMatch = e.name === match;
        const scopeMatch = e.forId ? e.forId === id : true;
        return nameMatch && scopeMatch;
      });
      const foundElement = !!element;
      const wrongScope = element?.forId && element.forId !== id;
      const inlined = element?.display === 'inline';
      if (!foundElement) {
        // Element reference does not exist, return plain text
        return match;
      }
      if (wrongScope) {
        // If element is not global and not scoped to this message, return plain text
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
    refElements,
    scopedActions
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
  const { preparedContent, inlinedElements, refElements, scopedActions } =
    prepareContent({
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
            }
          }}
        >
          {preparedContent}
        </ReactMarkdown>
      </Typography>
      <InlinedElements elements={inlinedElements} actions={scopedActions} />
    </Stack>
  );
});
