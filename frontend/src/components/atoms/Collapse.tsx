import { useToggle } from 'usehooks-ts';

import Box from '@mui/material/Box';
import MCollapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import ChevronDownIcon from 'assets/chevronDown';
import ChevronUpIcon from 'assets/chevronUp';

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
    <Box
      height={expandAll ? 'auto' : 200}
      position="relative"
      overflow="hidden"
    >
      <Box
        position={expandAll ? 'relative' : 'absolute'}
        top={0}
        left={0}
        right={0}
        bottom={0}
      >
        {children}
      </Box>
      {!expandAll && (
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          height={40}
          sx={{
            background: (theme) =>
              `linear-gradient(to bottom, rgba(255,255,255,0) 0%, ${theme.palette.background.default} 100%)`,
            pointerEvents: 'none'
          }}
        />
      )}
    </Box>
  );

  return (
    <Box>
      <MCollapse in={expandAll} collapsedSize={200} timeout={0}>
        {content}
      </MCollapse>
      <Stack direction="row" justifyContent="end">
        <Tooltip title={expandAll ? 'Collapse' : 'Expand'}>
          <IconButton onClick={toggleExpandAll}>
            {expandAll ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
};

export { Collapse };
