import {
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Typography,
  ListItem,
  ListItemText
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import KeyIcon from '@mui/icons-material/Key';
import { Link } from 'react-router-dom';
import { useAuth } from 'hooks/auth';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { projectSettingsState } from 'state/project';
import { settingsState } from 'state/settings';

interface Props {
  anchorEl: null | HTMLElement;
  open: boolean;
  handleClose: () => void;
}

export default function UserMenu({ anchorEl, open, handleClose }: Props) {
  const { user, logout } = useAuth();
  const pSettings = useRecoilValue(projectSettingsState);
  const setAppSettings = useSetRecoilState(settingsState);
  const requiredKeys = !!pSettings?.project?.user_env?.length;

  const userNameItem = user && (
    <ListItem key="user-name" sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography width="100%" fontSize="14px" fontWeight={700}>
        {user.name}
      </Typography>
      <Typography width="100%" fontSize="13px" fontWeight={400}>
        {user.email}
      </Typography>
    </ListItem>
  );

  const settingsItem = (
    <MenuItem
      key="settings"
      onClick={() => {
        setAppSettings((old) => ({ ...old, open: true }));
        handleClose();
      }}
    >
      <ListItemIcon>
        <SettingsIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Settings</ListItemText>
      <Typography variant="body2" color="text.secondary">
        S
      </Typography>
    </MenuItem>
  );

  const apiKeysItem = requiredKeys && (
    <MenuItem key="env" component={Link} to="/env">
      <ListItemIcon>
        <KeyIcon fontSize="small" />
      </ListItemIcon>
      API keys
    </MenuItem>
  );

  const logoutItem = user && (
    <MenuItem
      key="logout"
      onClick={() => {
        logout({
          logoutParams: {
            returnTo: window.location.origin
          }
        });
        handleClose();
      }}
    >
      <ListItemIcon>
        <LogoutIcon fontSize="small" />
      </ListItemIcon>
      Logout
    </MenuItem>
  );

  const menuItems = [
    userNameItem,
    settingsItem,
    apiKeysItem,
    logoutItem
  ].filter((i) => !!i);

  const itemsWithDivider = menuItems.reduce((acc, curr, i) => {
    if (i === menuItems.length - 1) {
      return [...acc, curr];
    }
    return [...acc, curr, <Divider sx={{ my: 1 }} key={`divider-${i}`} />];
  }, [] as React.ReactNode[]);

  return (
    <Menu
      anchorEl={anchorEl}
      id="account-menu"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: 220,
          overflow: 'visible',
          mt: 1.5,
          backgroundImage: 'none',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          boxShadow: (theme) =>
            theme.palette.mode === 'light'
              ? '0px 2px 4px 0px #0000000D'
              : '0px 10px 10px 0px #0000000D',
          '& .MuiAvatar-root': {
            width: 32,
            height: 32,
            ml: -0.5,
            mr: 1
          },
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: 'background.default',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0
          }
        }
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {itemsWithDivider}
    </Menu>
  );
}
