import { useRecoilValue } from 'recoil';

import Box from '@mui/material/Box';

import { Markdown } from 'components/molecules/Markdown';

import { useFetch } from 'hooks/useFetch';

import { type ITextElement } from 'client-types/';
import { projectSettingsState } from 'state/project';

interface Props {
  element: ITextElement;
}

const TextElement = ({ element }: Props) => {
  const { data, error, isLoading } = useFetch(element.url || null);
  const projectSettings = useRecoilValue(projectSettingsState);
  const allowHtml = projectSettings?.features?.unsafe_allow_html;
  const latex = projectSettings?.features?.latex;

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
      <Markdown allowHtml={allowHtml} latex={latex}>{content}</Markdown>
    </Box>
  );
};

export { TextElement };
