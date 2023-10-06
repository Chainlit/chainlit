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

let _scrollTop = 0;

const ConversationsHistorySidebar = (): JSX.Element | null => {
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width:800px)');

  const pSettings = useRecoilValue(projectSettingsState);

  const [open, setOpen] = useState(true);
  const [shouldLoadMore, setShouldLoadMore] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!ref.current) return;

    const { scrollHeight, clientHeight, scrollTop } = ref.current;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
    //We save the scroll top in order to scroll to the element when the page is changing.
    _scrollTop = scrollTop;

    setShouldLoadMore(atBottom);
  };

  useEffect(() => {
    ref.current?.scrollTo({
      top: _scrollTop
    });
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
          ref: ref,
          onScroll: handleScroll
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
        <ConversationsHistoryList shouldLoadMore={shouldLoadMore} />
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
