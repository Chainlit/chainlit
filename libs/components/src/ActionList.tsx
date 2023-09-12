import { MessageContext } from 'contexts/MessageContext';
import { useContext, useState } from 'react';

import { MoreHoriz } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  IconButton,
  Menu,
  Stack,
  Theme,
  useMediaQuery
} from '@mui/material';
import { Tooltip } from '@mui/material';

import { IAction } from './types/action';

interface ActionProps {
  action: IAction;
  loading: boolean;
}

const Action = ({ action, loading }: ActionProps) => {
  return (
    <Tooltip title={action.description} placement="top">
      <LoadingButton
        size="small"
        variant="outlined"
        id={action.id}
        onClick={action.onClick}
        disabled={loading}
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

  const renderActions = (items: IAction[]) =>
    items.map((action) => (
      <Action key={action.id} action={action} loading={loading} />
    ));

  return (
    <Box display="flex" alignItems="center" id="actions-list" margin="auto">
      {!isMobile ? (
        <Stack direction="row" spacing={1}>
          {renderActions(actions.slice(0, 2))}
        </Stack>
      ) : null}
      {actions.length > 2 ? (
        <>
          <Tooltip title="Actions">
            <IconButton
              id="actions-button"
              onClick={(event: React.MouseEvent<HTMLElement>) =>
                setAnchorEl(event.currentTarget)
              }
            >
              <MoreHoriz />
            </IconButton>
          </Tooltip>
          <Menu
            id="actions-menu"
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={() => setAnchorEl(null)}
            sx={{ marginTop: 1 }}
            PaperProps={{
              sx: {
                boxShadow: (theme) =>
                  theme.palette.mode === 'light'
                    ? '0px 2px 4px 0px #0000000D'
                    : '0px 10px 10px 0px #0000000D'
              }
            }}
          >
            <Stack direction="column" paddingX={2} gap={1}>
              {renderActions(
                isMobile ? actions : actions.slice(2, actions.length)
              )}
            </Stack>
          </Menu>
        </>
      ) : null}
    </Box>
  );
};

export { ActionList };
