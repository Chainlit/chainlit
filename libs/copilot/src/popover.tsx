import Chat from 'chat';
import { useState, useEffect, useContext } from 'react';

import { Box } from '@mui/material';
import Fade from '@mui/material/Fade';
import Popper from '@mui/material/Popper';
import useMediaQuery from '@mui/material/useMediaQuery';

import Header from 'components/Header';
import EvoyaHeader from 'evoya/EvoyaHeader';

interface Props {
  anchorEl?: HTMLElement | null;
}

export default function PopOver({ anchorEl }: Props) {
  const isMobileLayout = useMediaQuery('(max-width: 599px)');
  const [visualViewportHeight, setVisualViewportHeight] = useState(window.visualViewport?.height ?? window.innerHeight);
  const [visualViewportOffsetTop, setVisualViewportOffsetTop] = useState(window.visualViewport?.offsetTop ?? 0);

  const viewportHandler = () => {
    console.log("visualViewport event")
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
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", viewportHandler);
        window.visualViewport.removeEventListener("scroll", viewportHandler);
      }
    }
  }, []);

  return (
    <Popper
      id="chainlit-copilot-popover"
      open={Boolean(anchorEl)}
      anchorEl={isMobileLayout ? null : anchorEl}
      placement="top"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        inset: {
          xs: `${visualViewportOffsetTop}px 0px ${window.innerHeight - visualViewportOffsetTop}px 0px !important`,
          sm: 'auto auto 14px -24px !important'
        },
        height: {
          xs: `${visualViewportHeight}px`,
          sm: 'min(730px, calc(100vh - 100px))'
        },
        width: {
          xs: '100%',
          sm: 'min(400px, 80vw)'
        },
        overflow: 'hidden',
        borderRadius: {
          sm:'12px'
        },
        background: (theme) => theme.palette.background.default,
        boxShadow:
          '0 6px 6px 0 rgba(0,0,0,.02),0 8px 24px 0 rgba(0,0,0,.12)!important',
        zIndex: 9999
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
          {/* <Header /> */}
          <EvoyaHeader showClose={true} noShow={false} />
          <Chat />
        </Box>
      </Fade>
    </Popper>
  );
}
