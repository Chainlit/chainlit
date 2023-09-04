import { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Menu,
  Stack,
  Toolbar,
  useTheme
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

import RegularButton from 'components/atoms/buttons/button';
import GithubButton from 'components/atoms/buttons/githubButton';
import UserButton from 'components/atoms/buttons/userButton';
import NewChatButton from 'components/molecules/newChatButton';

import { projectSettingsState } from 'state/project';

interface INavItem {
  to: string;
  label: string;
}

function ActiveNavItem({ to, label }: INavItem) {
  return (
    <RegularButton component={Link} to={to} key={to}>
      {label}
    </RegularButton>
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

interface NavProps {
  hasDb?: boolean;
  hasReadme?: boolean;
}

function Nav({ hasDb, hasReadme }: NavProps) {
  const location = useLocation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<any>();

  let anchorEl;

  if (open && ref.current) {
    anchorEl = ref.current;
  }

  const matches = useMediaQuery(theme.breakpoints.down('md'));

  const tabs = [{ to: '/', label: 'Chat' }];

  if (hasDb) {
    tabs.push({ to: '/dataset', label: 'History' });
  }

  if (hasReadme) {
    tabs.push({ to: '/readme', label: 'Readme' });
  }

  const nav = (
    <Stack direction={matches ? 'column' : 'row'} spacing={1}>
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

  if (matches) {
    return (
      <>
        <IconButton
          ref={ref}
          edge="start"
          aria-label="open nav"
          onClick={() => setOpen(true)}
        >
          <MenuIcon />
        </IconButton>
        <Menu
          autoFocus
          anchorEl={anchorEl}
          open={open}
          onClose={() => setOpen(false)}
          PaperProps={{
            sx: {
              p: 1,
              backgroundImage: 'none',
              mt: -2,
              ml: -1,
              overflow: 'visible',
              overflowY: 'auto',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              boxShadow: (theme) =>
                theme.palette.mode === 'light'
                  ? '0px 2px 4px 0px #0000000D'
                  : '0px 10px 10px 0px #0000000D'
            }
          }}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          {nav}
        </Menu>
      </>
    );
  } else {
    return nav;
  }
}

export default function Header() {
  const pSettings = useRecoilValue(projectSettingsState);

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
          <Nav
            hasDb={!!pSettings?.project?.database}
            hasReadme={!!pSettings?.markdown}
          />
        </Stack>
        <Stack
          alignItems="center"
          sx={{ ml: 'auto' }}
          direction="row"
          spacing={1}
          color="text.primary"
        >
          <NewChatButton />
          <Box ml={1} />
          <GithubButton href={pSettings?.ui?.github} />
          <UserButton />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
