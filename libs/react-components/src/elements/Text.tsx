import { Markdown } from 'src/Markdown';

import Box from '@mui/material/Box';

import { useFetch } from 'hooks/useFetch';

import { type ITextElement } from 'client-types/';

interface Props {
  element: ITextElement;
}

const TextElement = ({ element }: Props) => {
  const { data, error, isLoading } = useFetch(element.url || null);

  let content = '';

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
    <Box sx={{ fontFamily: (theme) => theme.typography.fontFamily }}>
      <Markdown>{content}</Markdown>
    </Box>
  );
};

export { TextElement };
