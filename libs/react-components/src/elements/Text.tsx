import { Markdown } from 'src/Markdown';

import { ITextElement } from '@chainlit/react-client';

import { useApi } from 'hooks/index';

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

  return <Markdown>{content}</Markdown>;
};

export { TextElement };
