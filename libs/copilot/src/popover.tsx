import Chat from 'chat';
import { useState } from 'react';

import { Box } from '@mui/material';
import Fade from '@mui/material/Fade';
import Popper from '@mui/material/Popper';

import Header from 'components/Header';

interface Props {
  anchorEl?: HTMLElement | null;
  buttonHeight: string;
}

export default function PopOver({ anchorEl, buttonHeight }: Props) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Popper
      id="chainlit-copilot-popover"
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      placement="top"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        inset: 'auto auto 14px -24px !important',
        height: `min(730px, calc(100vh - ${buttonHeight} - 48px))`,
        width: expanded ? '80vw' : 'min(400px, 80vw)',
        overflow: 'hidden',
        borderRadius: '12px',
        background: (theme) => theme.palette.background.default,
        boxShadow:
          '0 6px 6px 0 rgba(0,0,0,.02),0 8px 24px 0 rgba(0,0,0,.12)!important',
        zIndex: 1000
      }}
    >
      <Fade in={!!anchorEl}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%'
          }}
        >
          <Header expanded={expanded} setExpanded={setExpanded} />
          <Chat />
        </Box>
      </Fade>
    </Popper>
  );
}
