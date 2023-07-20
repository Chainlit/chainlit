import { memo } from 'react';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import remarkGfm from 'remark-gfm';

import { Link, Stack, Typography } from '@mui/material';

import Code from 'components/atoms/Code';
import ElementRef from 'components/atoms/element/ref';

import { IAction } from 'state/action';
import { IElements } from 'state/element';

import InlinedElements from './inlined';

interface Props {
  id?: string;
  content?: string;
  elements: IElements;
  actions: IAction[];
  language?: string;
  authorIsUser?: boolean;
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

function prepareContent({ id, elements, actions, content, language }: Props) {
  const elementNames = elements
    .filter((e) => e.type !== 'avatar')
    .map((e) => escapeRegExp(e.name));

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
    (e) => isForIdMatch(id, e?.forIds) && e.display === 'inline'
  );
  const refElements: IElements = [];

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
