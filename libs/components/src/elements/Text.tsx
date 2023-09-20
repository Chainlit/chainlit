import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import remarkGfm from 'remark-gfm';
import { Code } from 'src/Code';

import Link from '@mui/material/Link';

import { useApi } from 'hooks/index';

import { ITextElement } from 'src/types/element';

interface Props {
  element: ITextElement;
}

const TextElement = ({ element }: Props) => {
  const { data, error, isLoading } = useApi(
    !element.content && element.url ? element.url : null
  );
  let content = element.content as string;

  if (isLoading) {
    content = 'Loading...';
  } else if (error) {
    content = 'An error occured';
  } else if (data) {
    content = data;
  }

  if (!isLoading && !error && element.language) {
    content = `\`\`\`${element.language}\n${content}\n\`\`\``;
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="markdown-body"
      components={{
        a: ({ children, ...props }) => (
          <Link {...props} target="_blank">
            {children}
          </Link>
        ),
        code: ({ ...props }) => <Code {...props} />
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export { TextElement };
