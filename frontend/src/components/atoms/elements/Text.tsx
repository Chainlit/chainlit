import Box from '@mui/material/Box';

import { type ITextElement, useConfig } from '@chainlit/react-client';

import { Markdown } from 'components/molecules/Markdown';

import { useFetch } from 'hooks/useFetch';

interface Props {
  element: ITextElement;
}

const TextElement = ({ element }: Props) => {
  const { data, error, isLoading } = useFetch(element.url || null);
  const { config } = useConfig();
  const allowHtml = config?.features?.unsafe_allow_html;
  const latex = config?.features?.latex;

  let content = '';

  if (isLoading) {
    content = 'Loading...';
  } else if (error) {
    content = 'An error occurred';
  } else if (data) {
    content = data;
  }

  if (!isLoading && !error && element.language) {
    content = `\`\`\`${element.language}\n${content}\n\`\`\``;
  }

  return (
    <Box sx={{ fontFamily: (theme) => theme.typography.fontFamily }}>
      <Markdown allowHtml={allowHtml} latex={latex}>
        {content}
      </Markdown>
    </Box>
  );
};

export { TextElement };
