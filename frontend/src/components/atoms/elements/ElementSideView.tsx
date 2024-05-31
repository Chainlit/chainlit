import { SyntheticEvent, forwardRef, useState } from 'react';
import { Resizable } from 'react-resizable';
import { useRecoilState } from 'recoil';
import { useWindowSize } from 'usehooks-ts';

import Close from '@mui/icons-material/Close';
import type { Theme } from '@mui/material';
import Box, { BoxProps } from '@mui/material/Box';
import MDrawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import styled from '@mui/material/styles/styled';
import useMediaQuery from '@mui/material/useMediaQuery';

import { sideViewState } from '@chainlit/react-client';

import 'react-resizable/css/styles.css';

import { Element } from './Element';

const DRAWER_DEFAULT_WIDTH = 400;

interface DrawerProps extends BoxProps {
  open?: boolean;
  width?: number | string;
  isSmallScreen?: boolean;
}

const Handle = forwardRef(function Handle(
  { ...props }: { handleAxis?: string },
  ref
) {
  // Make sure the dom element doesn't receive the handleAxis prop.
  delete props.handleAxis;
  return (
    <Box
      sx={{
        boxSizing: 'content-box',
        width: '4px',
        height: '24px',
        position: 'absolute',
        top: '50%',
        marginTop: '-12px',
        left: 0,
        cursor: 'ew-resize',
        padding: '10px 5px'
      }}
      ref={ref}
      {...props}
    >
      <Box
        sx={{
          boxSizing: 'content-box',
          width: '100%',
          height: '100%',
          backgroundColor: 'grey.300',
          borderRadius: '4px'
        }}
      />
    </Box>
  );
});

const ElementSideView = () => {
  const [resizeInProgress, setResizeInProgress] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState<number>(DRAWER_DEFAULT_WIDTH);
  const [sideViewElement, setSideViewElement] = useRecoilState(sideViewState);

  const handleResize = (
    _event: SyntheticEvent,
    data: { size: { width: number } }
  ) => setDrawerWidth(data.size.width);

  const { width } = useWindowSize();
  const isSmallScreen = useMediaQuery<Theme>((theme) =>
    theme.breakpoints.down('sm')
  );

  if (drawerWidth < DRAWER_DEFAULT_WIDTH && isSmallScreen) {
    setDrawerWidth(DRAWER_DEFAULT_WIDTH);
  }

  return (
    <Resizable
      width={drawerWidth}
      height={0} // Resizable requires height, but we don't want to limit height, so set it to 0.
      onResize={handleResize}
      onResizeStart={() => setResizeInProgress(true)}
      onResizeStop={() => setResizeInProgress(false)}
      resizeHandles={['w']}
      handle={!isSmallScreen ? <Handle /> : <></>}
      axis="x"
      minConstraints={[100, 0]} // Minimum width of 100px and no limit on height.
      maxConstraints={[width / 2, 0]} // Constraint the maximum width to the half of the screen without limit on height.
    >
      <Drawer
        anchor="right"
        isSmallScreen={isSmallScreen}
        open={!!sideViewElement}
        variant={isSmallScreen ? 'temporary' : 'persistent'}
        width={drawerWidth}
      >
        <Stack direction="row" alignItems="center">
          <Typography
            noWrap
            fontSize="20px"
            fontWeight={500}
            id="side-view-title"
          >
            {sideViewElement?.name}
          </Typography>
          <IconButton
            edge="end"
            sx={{ ml: 'auto' }}
            onClick={() => setSideViewElement(undefined)}
          >
            <Close />
          </IconButton>
        </Stack>

        <Box
          mt="1.5rem"
          id="side-view-content"
          sx={{
            height: '100%',
            pointerEvents: resizeInProgress ? 'none' : 'auto'
          }}
        >
          <Element element={sideViewElement} />
        </Box>
      </Drawer>
    </Resizable>
  );
};

const Drawer = styled(MDrawer, {
  shouldForwardProp: (prop) => prop !== 'isSmallScreen'
})<DrawerProps>(({ theme, open, width, isSmallScreen }) => ({
  width,
  flexShrink: 0,
  display: open ? 'flex' : 'none',
  '& .MuiDrawer-paper': {
    position: 'inherit',
    width,
    maxWidth: isSmallScreen ? '80%' : '100%',
    backgroundColor: theme.palette.background.paper,
    borderLeft: `1px solid ${theme.palette.divider}`,
    flexDirection: 'column',
    borderRadius: 0,
    color: theme.palette.text.primary,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    padding: '1.5rem',
    paddingTop: '.5rem',
    overflowX: 'hidden'
  }
}));

export { ElementSideView };
