import Chat from 'chat';

import Popover from '@mui/material/Popover';

interface Props {
  anchorEl?: HTMLElement | null;
  onClose: () => void;
}

export default function PopOver({ anchorEl, onClose }: Props) {
  return (
    <Popover
      hideBackdrop
      id="chainlit-copilot-popover"
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left'
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'left'
      }}
      slotProps={{
        root: { sx: { zIndex: 0 } }, // Deactivate popover backdrop to prevent it from blocking the app
        paper: {
          sx: {
            display: 'flex',
            mt: -2,
            ml: -1,
            height: 730,
            width: 400,
            overflow: 'hidden',
            borderRadius: '12px',
            background: (theme) => theme.palette.background.default,
            boxShadow:
              '0 6px 6px 0 rgba(0,0,0,.02),0 8px 24px 0 rgba(0,0,0,.12)!important'
          }
        }
      }}
    >
      <Chat />
    </Popover>
  );
}
