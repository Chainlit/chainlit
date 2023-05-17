import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import remarkGfm from 'remark-gfm';
import { Typography, Link, Stack } from '@mui/material';
import { IElements } from 'state/element';
import InlinedElements from '../../element/inlined';
import { memo } from 'react';
import { IActions } from 'state/action';
import ElementRef from './elementRef';
import ActionRef from './actionRef';
import Code from 'components/Code';

interface Props {
  content?: string;
  elements: IElements;
  actions: IActions;
  language?: string;
  authorIsUser?: boolean;
}

function prepareContent({ elements, actions, content, language }: Props) {
  const elementNames = Object.keys(elements);
  const elementRegexp = elementNames.length
    ? new RegExp(`(${elementNames.join('|')})`, 'g')
    : undefined;

  const actionContents = Object.values(actions).map((a) => a.trigger);
  const actionRegexp = actionContents.length
    ? new RegExp(`(${actionContents.join('|')})`, 'g')
    : undefined;

  let preparedContent = content ? content.trim() : '';
  const inlinedElements: IElements = {};

  if (elementRegexp) {
    preparedContent = preparedContent.replaceAll(elementRegexp, (match) => {
      if (elements[match].display === 'inline') {
        inlinedElements[match] = elements[match];
      }
      // spaces break markdown links. The address in the link is not used anyway
      return `[${match}](${match.replaceAll(' ', '_')})`;
    });
  }

  if (actionRegexp) {
    preparedContent = preparedContent.replaceAll(actionRegexp, (match) => {
      // spaces break markdown links. The address in the link is not used anyway
      return `[${match}](${match.replaceAll(' ', '_')})`;
    });
  }

  if (language) {
    preparedContent = `\`\`\`${language}\n${preparedContent}\n\`\`\``;
  }
  return { preparedContent, inlinedElements };
}

export default memo(function MessageContent({
  content,
  elements,
  actions,
  language,
  authorIsUser
}: Props) {
  const { preparedContent, inlinedElements } = prepareContent({
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
              const element = elements[name];
              const action = Object.values(actions).find(
                (a) => a.trigger === name
              );

              if (element) {
                return <ElementRef element={element} />;
              } else if (action) {
                return <ActionRef action={action} />;
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
      <InlinedElements inlined={inlinedElements} />
    </Stack>
  );
});
