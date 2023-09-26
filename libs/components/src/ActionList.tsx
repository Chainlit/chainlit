import { MessageContext } from 'contexts/MessageContext';
import { useContext, useState } from 'react';

import MoreHoriz from '@mui/icons-material/MoreHoriz';
import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import type { Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { IAction } from './types/action';

interface ActionProps {
  action: IAction;
  loading: boolean;
  margin: number | string;
}

const ICON_SIZE = '16px';

const Action = ({ action, loading, margin }: ActionProps) => {
  return (
    <Tooltip title={action.description} placement="top">
      <LoadingButton
        size="small"
        variant="outlined"
        id={action.id}
        onClick={action.onClick}
        disabled={loading}
        sx={{ margin }}
      >
        {action.label || action.name}
      </LoadingButton>
    </Tooltip>
  );
};

const ActionList = ({ actions }: { actions: IAction[] }) => {
  const { loading } = useContext(MessageContext);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('sm')
  );

  const renderActions = (items: IAction[], collapsed: boolean = false) =>
    items.map((action) => (
      <Action
        key={action.id}
        action={action}
        loading={loading}
        margin={collapsed ? 0 : '5px'}
      />
    ));

  const displayedActions = isMobile
    ? null
    : renderActions(actions.filter((a) => !a.collapsed));
  const drawerActions = isMobile
    ? renderActions(actions, true)
    : renderActions(
        actions.filter((a) => a.collapsed),
        true
      );

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent={displayedActions?.length ? 'space-between' : 'end'}
      id="actions-list"
      margin="auto"
      width={'100%'}
    >
      {displayedActions ? (
        <Box
          display="flex"
          flexWrap="wrap"
          alignItems="center"
          justifyContent="center"
        >
          {displayedActions}
        </Box>
      ) : null}
      {isMobile || drawerActions?.length ? (
        <>
          <Tooltip title="Actions">
            <IconButton
              id="actions-button"
              onClick={(event: React.MouseEvent<HTMLElement>) =>
                setAnchorEl(event.currentTarget)
              }
            >
              <MoreHoriz sx={{ width: ICON_SIZE, height: ICON_SIZE }} />
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
              {drawerActions}
            </Stack>
          </Menu>
        </>
      ) : null}
    </Box>
  );
};

export { ActionList };
