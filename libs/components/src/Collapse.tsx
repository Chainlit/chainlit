import { useToggle } from 'usehooks-ts';

import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import MCollapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

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
      <MCollapse in={expandAll} collapsedSize={100} timeout={0}>
        {children}
      </MCollapse>
      <Stack direction="row" justifyContent="end">
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

export { Collapse };
