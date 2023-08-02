import {
  ReactNode,
  SyntheticEvent,
  forwardRef,
  useMemo,
  useState
} from 'react';
import { Resizable } from 'react-resizable';
import { useRecoilState } from 'recoil';
import { useWindowSize } from 'usehooks-ts';

import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  BoxProps,
  IconButton,
  Drawer as MDrawer,
  Stack,
  Theme,
  Typography,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';

import { sideViewState } from 'state/element';

import 'react-resizable/css/styles.css';

import { renderElement } from './view';

const DRAWER_DEFAULT_WIDTH = 400;

interface MainDrawerProps {
  open?: boolean;
  width?: number;
}

interface DrawerProps extends BoxProps {
  open?: boolean;
  width?: number | string;
  isSmallScreen?: boolean;
}

interface SideViewProps {
  children: ReactNode;
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

const SideView = ({ children }: SideViewProps) => {
  const [sideViewElement, setSideViewElement] = useRecoilState(sideViewState);
  const [resizeInProgress, setResizeInProgress] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState<number>(DRAWER_DEFAULT_WIDTH);

  const handleResize = (
    event: SyntheticEvent,
    data: { size: { width: number } }
  ) => setDrawerWidth(data.size.width);

  const { width } = useWindowSize();
  const isSmallScreen = !useMediaQuery<Theme>((theme) =>
    theme.breakpoints.up('sm')
  );

  const element = useMemo(() => {
    if (sideViewElement) {
      return renderElement(sideViewElement);
    }
    return null;
  }, [sideViewElement]);

  drawerWidth;

  if (drawerWidth < DRAWER_DEFAULT_WIDTH && isSmallScreen) {
    setDrawerWidth(DRAWER_DEFAULT_WIDTH);
  }

  return (
    <>
      <MainDrawer open={!!sideViewElement} width={drawerWidth}>
        {children}
      </MainDrawer>
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
    </>
  );
};

const MainDrawer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'open'
})<MainDrawerProps>(({ theme, open, width = DRAWER_DEFAULT_WIDTH }) => ({
  width: '100%',
  marginRight: !open && theme.breakpoints.up('sm') ? -width : 0,
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  padding: '0 16px',
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing[open ? 'easeOut' : 'sharp'],
    duration:
      theme.transitions.duration[open ? 'enteringScreen' : 'leavingScreen']
  })
}));

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
    backgroundColor:
      theme.palette.mode === 'dark'
        ? theme.palette.grey[800]
        : theme.palette.grey[100],
    borderLeft: `1px solid ${
      theme.palette.mode === 'dark'
        ? theme.palette.grey[800]
        : theme.palette.grey[200]
    }`,
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

export default SideView;
