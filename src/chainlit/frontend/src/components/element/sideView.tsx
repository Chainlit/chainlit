import { forwardRef, useEffect, useMemo, useState } from 'react';
import { Resizable } from 'react-resizable';
import { useRecoilState } from 'recoil';

import CloseIcon from '@mui/icons-material/Close';
import { Box, BoxProps, IconButton, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { renderElement } from 'components/element/view';

import { useWidthCalc } from 'hooks/window';

import { sideViewState } from 'state/element';

import 'react-resizable/css/styles.css';

interface DrawerProps extends BoxProps {
  open?: boolean;
  width?: number | string;
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
          width: '100%',
          height: '100%',
          backgroundColor: 'grey.300',
          borderRadius: '4px'
        }}
      />
    </Box>
  );
});

const Drawer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'open'
})<DrawerProps>(({ theme, open, width }) => ({
  width,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? theme.palette.grey[800]
      : theme.palette.grey[100],
  borderLeft: `1px solid ${
    theme.palette.mode === 'dark'
      ? theme.palette.grey[800]
      : theme.palette.grey[200]
  }`,
  display: open ? 'flex' : 'none',
  flexDirection: 'column',
  borderRadius: 0,
  flexShrink: 0,
  color: theme.palette.text.primary,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  padding: '1.5rem',
  paddingTop: '.5rem',
  overflowX: 'hidden'
}));

const SideView = () => {
  const [sideViewElement, setSideViewElement] = useRecoilState(sideViewState);
  const [resizeInProgress, setResizeInProgress] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState<number>(400);
  const windowWidth = useWidthCalc();

  const handleResize = (event: any, data: { size: { width: number } }) => {
    setDrawerWidth(data.size.width);
  };

  const minWidth = 100;
  const maxWidth = useMemo(() => {
    const halfScreenWidth = Math.floor(windowWidth / 2);
    return halfScreenWidth > minWidth ? halfScreenWidth : minWidth;
  }, [windowWidth]);

  // Set initial drawerWidth of element when given
  useEffect(() => {
    if (!sideViewElement?.drawerWidth) return;
    setDrawerWidth(
      Math.min(Math.max(sideViewElement.drawerWidth, minWidth), maxWidth)
    );
  }, [windowWidth, sideViewElement]);

  const element = useMemo(() => {
    if (sideViewElement) {
      return renderElement(sideViewElement);
    }
    return null;
  }, [sideViewElement]);

  return (
    <Resizable
      width={drawerWidth}
      height={0} // Resizable requires height, but we don't want to limit height, so set it to 0.
      onResize={handleResize}
      onResizeStart={() => setResizeInProgress(true)}
      onResizeStop={() => setResizeInProgress(false)}
      resizeHandles={['w']}
      handle={<Handle />}
      axis="x"
      minConstraints={[minWidth, 0]} // Minimum width of 100px and no limit on height.
      maxConstraints={[maxWidth, 0]} // Maximum width of windowWidth / 2 and no limit on height.
    >
      <Drawer open={!!sideViewElement} width={drawerWidth}>
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
            <CloseIcon />
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
          {element}
        </Box>
      </Drawer>
    </Resizable>
  );
};

export default SideView;
