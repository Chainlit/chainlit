import {
  useEffect,
  useMemo,
} from 'react';

import Box from '@mui/material/Box';

import useEvoyaCreator from '@/hooks/useEvoyaCreator';
import MarkdownEditor from './markdownEditor';

import CreatorHeader from './CreatorHeader';
import { Height } from '@mui/icons-material';

export default function CreatorFrame() {
  const {
    active,
    creatorType,
    openCreatorWithContent
  } = useEvoyaCreator();

  useEffect(() => {
    // @ts-expect-error is not a valid prop
    window.openEvoyaCreator = openCreatorWithContent;
  }, [openCreatorWithContent]);

  const CreatorRenderer = useMemo(() => {
    switch(creatorType.toLowerCase()) {
      default:
      case 'markdown':
        return <MarkdownEditor />
      case 'vega':
        return <MarkdownEditor />
    }
  }, [creatorType]);

  if (!active) {
    return null;
  }

  return (
    <Box
      sx={{
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CreatorHeader />
      {CreatorRenderer}
    </Box>
  );
}