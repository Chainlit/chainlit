import { useToggle } from 'usehooks-ts';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import MCollapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

interface CollapseProps {
  children: React.ReactNode;
  defaultExpandAll?: boolean;
}

const Collapse = ({
  children,
  defaultExpandAll = false
}: CollapseProps): JSX.Element => {
  const [expandAll, toggleExpandAll] = useToggle(defaultExpandAll);

  const content = (
    <Box height={expandAll ? 'auto' : 100} position="relative">
      <Box
        position={expandAll ? 'relative' : 'absolute'}
        top={0}
        left={0}
        right={0}
        bottom={0}
      >
        {children}
      </Box>
    </Box>
  );

  return (
    <Box>
      <MCollapse in={expandAll} collapsedSize={100} timeout={0}>
        {content}
      </MCollapse>
      <Stack direction="row" justifyContent="end">
        <Tooltip title={expandAll ? 'Collapse' : 'Expand'}>
          <IconButton onClick={toggleExpandAll}>
            {expandAll ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
};

export { Collapse };
