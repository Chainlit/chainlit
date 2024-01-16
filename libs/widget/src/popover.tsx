import Chat from 'chat';

import Popover from '@mui/material/Popover';

interface Props {
  anchorEl?: HTMLElement | null;
  onClose: () => void;
}

export default function PopOver({ anchorEl, onClose }: Props) {
  return (
    <Popover
      id="chainlit-popover"
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
        paper: {
          sx: {
            display: 'flex',
            mt: -2,
            ml: -1,
            height: 730,
            width: 400,
            overflow: 'hidden',
            borderRadius: '12px',
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
