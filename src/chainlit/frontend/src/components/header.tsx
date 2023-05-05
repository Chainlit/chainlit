import { Button, IconButton, Stack, Tooltip } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { Link, useLocation } from 'react-router-dom';
import UserAvatar from './chat/userAvatar';
import { useAuth } from 'hooks/auth';
import { useRecoilValue } from 'recoil';
import { projectSettingsState } from 'state/project';
import ThemeButton from 'themeButton';
import KeyIcon from '@mui/icons-material/Key';
import NewChatButton from './chat/newChatButton';

interface INavItem {
  to: string;
  label: string;
}

function ActiveNavItem({ to, label }: INavItem) {
  return (
    <Button
      component={Link}
      to={to}
      key={to}
      sx={{
        textTransform: 'none',
        color: (theme) =>
          theme.palette.mode === 'dark'
            ? 'text.primary'
            : theme.palette.primary.main,
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? theme.palette.background.paperVariant
            : theme.palette.primary.light,
        '&:hover': {
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.palette.background.paperVariant
              : theme.palette.primary.light
        }
      }}
    >
      {label}
    </Button>
  );
}

function NavItem({ to, label }: INavItem) {
  return (
    <Button
      component={Link}
      to={to}
      key={to}
      sx={{
        textTransform: 'none',
        color: 'text.secondary',
        '&:hover': {
          background: 'transparent'
        }
      }}
    >
      {label}
    </Button>
  );
}

function Nav() {
  const { isProjectMember } = useAuth();
  const location = useLocation();

  const tabs = [{ to: '/', label: 'Chat' }];

  if (isProjectMember) {
    tabs.push({ to: '/dataset', label: 'History' });
  }

  return (
    <Stack direction="row" spacing={1}>
      {tabs.map((t) => {
        const active = location.pathname === t.to;
        return (
          <div key={t.to}>
            {active ? <ActiveNavItem {...t} /> : <NavItem {...t} />}
          </div>
        );
      })}
    </Stack>
  );
}

export default function Header() {
  const pSettings = useRecoilValue(projectSettingsState);
  const requiredKeys = !!pSettings?.userEnv?.length;

  return (
    <AppBar elevation={0} color="transparent" position="static">
      <Toolbar
        sx={{
          minHeight: '60px !important',
          borderBottomWidth: '1px',
          borderBottomStyle: 'solid',
          background: (theme) => theme.palette.background.paper,
          borderBottomColor: (theme) => theme.palette.divider
        }}
      >
        <Stack alignItems="center" direction="row">
          <Nav />
        </Stack>
        <Stack
          alignItems="center"
          sx={{ ml: 'auto' }}
          direction="row"
          spacing={2}
        >
          <NewChatButton />
          {requiredKeys && (
            <Tooltip title="API keys">
              <IconButton component={Link} to="/env">
                <KeyIcon />
              </IconButton>
            </Tooltip>
          )}
          <ThemeButton />
          <UserAvatar />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
