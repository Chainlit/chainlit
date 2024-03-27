import { useState } from 'react';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import type { IAction } from 'client-types/';

import { ActionButton } from './ActionButton';

const ICON_SIZE = '16px';

const ActionDrawerButton = ({ actions }: { actions: IAction[] }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <Tooltip title="More Actions">
        <IconButton
          id="actions-drawer-button"
          onClick={(event: React.MouseEvent<HTMLElement>) =>
            setAnchorEl(event.currentTarget)
          }
        >
          <MoreVertIcon sx={{ width: ICON_SIZE, height: ICON_SIZE }} />
        </IconButton>
      </Tooltip>
      <Menu
        id="actions-menu"
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        sx={{ marginTop: 1 }}
        slotProps={{
          paper: {
            sx: {
              boxShadow: (theme) =>
                theme.palette.mode === 'light'
                  ? '0px 2px 4px 0px #0000000D'
                  : '0px 10px 10px 0px #0000000D'
            }
          }
        }}
      >
        <Stack direction="column" paddingX={2} gap={1}>
          {actions.map((action) => (
            <ActionButton
              key={action.id}
              onClick={() => setAnchorEl(null)}
              action={action}
              margin={0}
            />
          ))}
        </Stack>
      </Menu>
    </>
  );
};

export { ActionDrawerButton };
