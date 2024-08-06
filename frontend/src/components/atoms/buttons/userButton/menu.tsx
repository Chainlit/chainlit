import { Link } from 'react-router-dom';
import { useRecoilState } from 'recoil';

import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import KeyIcon from '@mui/icons-material/Key';
import LogoutIcon from '@mui/icons-material/Logout';
import {
  Box,
  Divider,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography
} from '@mui/material';

import { useAuth, useConfig } from '@chainlit/react-client';

import { SwitchInput } from 'components/atoms/inputs/SwitchInput';
import { Translator } from 'components/i18n';

import { settingsState } from 'state/settings';

interface Props {
  anchorEl: null | HTMLElement;
  open: boolean;
  handleClose: () => void;
}

export default function UserMenu({ anchorEl, open, handleClose }: Props) {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useRecoilState(settingsState);
  const { config } = useConfig();
  const requiredKeys = !!config?.userEnv?.length;

  const userNameItem = user && (
    <ListItem key="user-name" sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography width="100%" fontSize="14px" fontWeight={700}>
        {user.id}
      </Typography>
      <Typography width="100%" fontSize="13px" fontWeight={400}>
        {user.display_name || user.identifier}
      </Typography>
    </ListItem>
  );

  const themeItem = (
    <ListItem key="theme" sx={{ display: 'flex', gap: 1 }}>
      <ListItemIcon>
        <DarkModeOutlined />
      </ListItemIcon>
      <ListItemText
        id="switch-theme"
        secondary={
          <Translator path="components.molecules.settingsModal.darkMode" />
        }
      />
      <Box>
        <SwitchInput
          id="switch-theme"
          onChange={() => {
            const variant = settings.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('themeVariant', variant);
            setSettings((old) => ({ ...old, theme: variant }));
          }}
          checked={settings.theme === 'dark'}
          inputProps={{
            'aria-labelledby': 'switch-theme'
          }}
        />
      </Box>
    </ListItem>
  );

  const apiKeysItem = requiredKeys && (
    <MenuItem key="env" component={Link} to="/env">
      <ListItemIcon>
        <KeyIcon fontSize="small" />
      </ListItemIcon>
      <Translator path="components.atoms.buttons.userButton.menu.APIKeys" />
    </MenuItem>
  );

  const logoutItem = user && (
    <MenuItem
      key="logout"
      onClick={() => {
        logout(true);
        handleClose();
      }}
    >
      <ListItemIcon>
        <LogoutIcon fontSize="small" />
      </ListItemIcon>
      <Translator path="components.atoms.buttons.userButton.menu.logout" />
    </MenuItem>
  );

  const menuItems = [userNameItem, themeItem, apiKeysItem, logoutItem].filter(
    (i) => !!i
  );

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
      transformOrigin={{ horizontal: 'center', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
    >
      {itemsWithDivider}
    </Menu>
  );
}
