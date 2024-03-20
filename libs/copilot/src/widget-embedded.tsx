import Box from '@mui/material/Box';

import Chat from 'chat';

import Header from 'components/Header';

import { useState, useEffect } from 'react';

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
  // top: '10px',
  left: '10px',
  right: '10px',
  // bottom: '10px',
  // transform: 'translate(-50%, -50%)',
  // width: 'calc(100% - 20px)',
  // height: 'calc(100% - 20px)',
  // bgcolor: 'background.paper',
  background: (theme) => theme.palette.background.default,
  borderRadius: '10px',
  overflow: 'hidden',
  boxShadow: 24,
  p: 0,
  zIndex: 9999
};

export default function WidgetEmbedded() {
  const [open, setOpen] = useState(false);
  const [visualViewportHeight, setVisualViewportHeight] = useState(window.innerHeight);
  const [visualViewportOffsetTop, setVisualViewportOffsetTop] = useState(0);
  // const handleOpen = () => setOpen(true);
  // const handleClose = () => setOpen(false);

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
    window.addEventListener('chainlit-close-modal', () => {
      setOpen(false)
    });
    window.addEventListener('chainlit-open-modal', () => {
      setOpen(true)
    });
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
        <Header showClose={open} />
        <Chat />
      </Box>
    </Box>
  );
}
