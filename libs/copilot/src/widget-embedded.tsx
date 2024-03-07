import Box from '@mui/material/Box';

import Chat from 'chat';

import Header from 'components/Header';
import Modal from '@mui/material/Modal';

import { useState, useEffect } from 'react';

const style = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%'
};

const styleOpen = {
  display: 'flex',
  flexDirection: 'column',
  position: 'fixed' as 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'calc(100% - 20px)',
  height: 'calc(100% - 20px)',
  bgcolor: 'background.paper',
  borderRadius: '10px',
  overflow: 'hidden',
  boxShadow: 24,
  p: 0,
  zIndex: 1050
};

export default function WidgetEmbedded() {
  const [open, setOpen] = useState(false);
  // const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    window.addEventListener('chainlit-close-modal', () => {
      setOpen(false)
    });
    window.addEventListener('chainlit-open-modal', () => {
      setOpen(true)
    });
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
      <Box sx={open ? styleOpen : style}>
        <Header showClose={open} />
        <Chat />
      </Box>
      {/*open ? (
        <Modal
          open={true}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <Header />
            <Chat />
          </Box>
        </Modal>
      ) : (
        <>
          <Header />
          <Chat />
        </>
      )*/}
    </Box>
  );
}
