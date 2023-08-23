import React from 'react';
import { useToggle } from 'usehooks-ts';

import { DownloadRounded, ExpandLess, ExpandMore } from '@mui/icons-material';
import {
  Box,
  IconButton,
  Collapse as MCollapse,
  Stack,
  Theme
} from '@mui/material';

interface CollapseProps {
  children: React.ReactNode;
  onDownload: () => void;
}

const Collapse = ({ children, onDownload }: CollapseProps): JSX.Element => {
  const [expandAll, toggleExpandAll] = useToggle(false);

  return (
    <Box>
      <MCollapse
        sx={{
          border: (theme: Theme) => `3px solid ${theme.palette.divider}`,
          borderRadius: 1,
          padding: 1
        }}
        in={expandAll}
        collapsedSize={30}
      >
        {children}
      </MCollapse>
      <Stack
        sx={{
          position: 'absolute',
          right: 0
        }}
        direction="row"
      >
        <IconButton onClick={toggleExpandAll}>
          {expandAll ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
        <IconButton onClick={onDownload}>
          <DownloadRounded />
        </IconButton>
      </Stack>
    </Box>
  );
};

export default Collapse;
