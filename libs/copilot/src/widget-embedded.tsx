import Box from '@mui/material/Box';

import Chat from 'chat';

import EvoyaHeader from 'evoya/EvoyaHeader';

import { useState, useEffect, useContext } from 'react';

import { WidgetContext } from 'context';

const style = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: (theme) => theme.palette.background.default,
  borderRadius: '10px',
  overflow: 'hidden',
  position: 'relative'
};

const styleOpen = {
  display: 'flex',
  flexDirection: 'column',
  position: 'fixed' as 'fixed',
  left: '10px',
  right: '10px',
  background: (theme) => theme.palette.background.default,
  borderRadius: '10px',
  overflow: 'hidden',
  boxShadow: 24,
  p: 0,
  zIndex: 9999
};

export default function WidgetEmbedded() {
  const { evoya } = useContext(WidgetContext);
  const [open, setOpen] = useState(false);
  const [visualViewportHeight, setVisualViewportHeight] = useState(window.innerHeight);
  const [visualViewportOffsetTop, setVisualViewportOffsetTop] = useState(0);

  const viewportHandler = () => {
    if (window.visualViewport) {
      setVisualViewportHeight(window.visualViewport.height);
      setVisualViewportOffsetTop(window.visualViewport.offsetTop);
    }
  }

  useEffect(() => {
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", viewportHandler);
      window.visualViewport.addEventListener("scroll", viewportHandler);
    }
    if (evoya?.type !== 'dashboard') {
      window.addEventListener('chainlit-close-modal', () => {
        setOpen(false)
      });
      window.addEventListener('chainlit-open-modal', () => {
        setOpen(true)
      });
    }
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", viewportHandler);
        window.visualViewport.removeEventListener("scroll", viewportHandler);
      }
    }
  }, [])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%'
      }}
    >
      <Box
        sx={
          open ?
          {
            ...styleOpen,
            top: `${visualViewportOffsetTop + 10}px`,
            bottom: `${window.innerHeight - visualViewportHeight - visualViewportOffsetTop + 10}px`
          }
          : style
        }
      >
        <EvoyaHeader showClose={open} noShow={false} />
        <Chat />
      </Box>
    </Box>
  );
}
