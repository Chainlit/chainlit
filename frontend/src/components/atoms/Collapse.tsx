import React from 'react';
import { useToggle } from 'usehooks-ts';

import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {
  Box,
  IconButton,
  Collapse as MCollapse,
  Stack,
  Theme,
  Tooltip
} from '@mui/material';

interface CollapseProps {
  children: React.ReactNode;
  onDownload: () => void;
  defaultExpandAll?: boolean;
}

const Collapse = ({
  children,
  onDownload,
  defaultExpandAll = false
}: CollapseProps): JSX.Element => {
  const [expandAll, toggleExpandAll] = useToggle(defaultExpandAll);

  return (
    <Box>
      <MCollapse
        sx={{
          border: (theme: Theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          padding: 1
        }}
        in={expandAll}
        collapsedSize={100}
        timeout={0}
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
        <Tooltip title={expandAll ? 'Collapse' : 'Expand'}>
          <IconButton onClick={toggleExpandAll}>
            {expandAll ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Download">
          <IconButton onClick={onDownload}>
            <DownloadOutlined />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
};

export default Collapse;
