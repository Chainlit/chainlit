import { type ITextElement, useConfig } from '@chainlit/react-client';

import Alert from '@/components/Alert';
import Markdown from '@/components/Markdown';
import { Skeleton } from '@/components/ui/skeleton';

import { useFetch } from 'hooks/useFetch';

interface TextElementProps {
  element: ITextElement;
}

const TextElement = ({ element }: TextElementProps) => {
  const { data, error, isLoading } = useFetch(element.url || null);
  const { config } = useConfig();
  const allowHtml = config?.features?.unsafe_allow_html;
  const latex = config?.features?.latex;

  let content = '';

  if (isLoading) {
    return <Skeleton className="h-4 w-full" />;
  }

  if (error) {
    return (
      <Alert variant="error">An error occurred while loading the content</Alert>
    );
  }

  if (data) {
    content = data;
  }

  if (element.language) {
    content = `\`\`\`${element.language}\n${content}\n\`\`\``;
  }

  return (
    <Markdown
      allowHtml={allowHtml}
      latex={latex}
      className={`${element.display}-text`}
    >
      {content}
    </Markdown>
  );
};

export { TextElement };
