import { useAuth } from 'api/auth';
import { memo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Menu,
  Stack,
  Toolbar
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

import { RegularButton } from '@chainlit/react-components';

import GithubButton from 'components/atoms/buttons/githubButton';
import UserButton from 'components/atoms/buttons/userButton';
import { Logo } from 'components/atoms/logo';
import NewChatButton from 'components/molecules/newChatButton';

import { IProjectSettings } from 'state/project';

import { OpenThreadListButton } from './threadHistory/sidebar/OpenThreadListButton';

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
  dataPersistence?: boolean;
  hasReadme?: boolean;
  matches?: boolean;
}

const Nav = ({ dataPersistence, hasReadme, matches }: NavProps) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<any>();

  const { t } = useTranslation();

  let anchorEl;

  if (open && ref.current) {
    anchorEl = ref.current;
  }

  const tabs = [{ to: '/', label: t('components.organisms.header.chat') }];

  if (hasReadme) {
    tabs.push({
      to: '/readme',
      label: t('components.organisms.header.readme')
    });
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
        {isAuthenticated && dataPersistence ? <OpenThreadListButton /> : null}
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
};

const Header = memo(
  ({ projectSettings }: { projectSettings?: IProjectSettings }) => {
    const matches = useMediaQuery('(max-width: 66rem)');

    return (
      <AppBar elevation={0} color="transparent" position="static">
        <Toolbar
          sx={{
            padding: (theme) => `0 ${theme.spacing(2)} !important`,
            minHeight: '60px !important',
            borderBottomWidth: '1px',
            borderBottomStyle: 'solid',
            background: (theme) => theme.palette.background.paper,
            borderBottomColor: (theme) => theme.palette.divider
          }}
        >
          <Stack alignItems="center" direction={'row'} gap={!matches ? 3 : 0}>
            {!matches ? <Logo style={{ maxHeight: '25px' }} /> : null}
            <Nav
              matches={matches}
              dataPersistence={projectSettings?.dataPersistence}
              hasReadme={!!projectSettings?.markdown}
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
            <GithubButton href={projectSettings?.ui?.github} />
            <UserButton />
          </Stack>
        </Toolbar>
      </AppBar>
    );
  }
);

export { Header };
