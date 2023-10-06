import { useEffect, useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';

import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import Box from '@mui/material/Box';
import MDrawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import styled from '@mui/material/styles/styled';
import useMediaQuery from '@mui/material/useMediaQuery';

import { useAuth } from 'hooks/auth';

import { projectSettingsState } from 'state/project';

import { ConversationsHistoryList } from './ConversationsHistoryList';
import Filters from './filters';

const DRAWER_WIDTH = 240;

let scrollTop = 0;

const ConversationsHistorySidebar = (): JSX.Element | null => {
  const isMobile = useMediaQuery('(max-width:800px)');
  const [open, setOpen] = useState(true);
  const pSettings = useRecoilValue(projectSettingsState);
  const { user } = useAuth();

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saveScroll = () => {
      scrollTop = ref.current?.scrollTop || 0;
    };

    ref.current?.scrollTo({
      top: scrollTop
    });
    ref.current?.addEventListener('scroll', saveScroll);

    return () => ref.current?.removeEventListener('scroll', saveScroll);
  }, []);

  if (!pSettings?.dataPersistence || !user) {
    return null;
  }

  return (
    <>
      <Drawer
        anchor="left"
        open={open}
        variant={isMobile ? 'temporary' : 'persistent'}
        hideBackdrop
        PaperProps={{
          ref: ref
        }}
      >
        <Stack
          sx={{
            px: 2,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 1.5
          }}
        >
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 600,
              color: (theme) => theme.palette.text.primary
            }}
          >
            Chat History
          </Typography>
          <IconButton edge="end" onClick={() => setOpen(false)}>
            <KeyboardDoubleArrowLeftIcon sx={{ color: 'grey.500' }} />
          </IconButton>
        </Stack>
        <Filters />
        <ConversationsHistoryList />
      </Drawer>
      <Box
        sx={{
          position: 'absolute',
          mt: 1,
          ml: 1,
          zIndex: !open ? 1 : -1,
          opacity: !open ? 1 : 0
        }}
      >
        <IconButton
          sx={{
            borderRadius: 1,
            backgroundColor: (theme) => theme.palette.background.paper
          }}
          onClick={() => setOpen(true)}
        >
          <KeyboardDoubleArrowRightIcon />
        </IconButton>
      </Box>
    </>
  );
};

const Drawer = styled(MDrawer, {
  shouldForwardProp: (prop) => prop !== 'isSmallScreen'
})<{ open: boolean }>(({ open }) => ({
  width: open ? DRAWER_WIDTH : 0,
  '& .MuiDrawer-paper': {
    position: 'inherit',
    gap: 10,
    display: 'flex',
    padding: '0px 4px',
    backgroundImage: 'none'
  }
}));

export { ConversationsHistorySidebar };
