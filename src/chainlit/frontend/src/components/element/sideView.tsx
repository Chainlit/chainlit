import CloseIcon from '@mui/icons-material/Close';
import { IconButton, Box, BoxProps, Typography, Stack } from '@mui/material';
import { styled, Theme, CSSObject } from '@mui/material/styles';
import { renderElement } from 'components/element/view';
import { useRecoilState } from 'recoil';
import { sideViewState } from 'state/element';

const drawerWidth = 400;

const openedMixin = (theme: Theme): CSSObject => ({
  padding: '1.5rem',
  paddingTop: '.5rem',
  width: drawerWidth,
  transition: theme.transitions.create('transform', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen
  }),
  overflowX: 'hidden'
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('transform', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  overflowX: 'hidden',
  width: 0
});

interface DrawerProps extends BoxProps {
  open?: boolean;
}

const Drawer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'open'
})<DrawerProps>(({ theme, open }) => ({
  backgroundColor:
    theme.palette.mode === 'dark'
      ? theme.palette.grey[800]
      : theme.palette.grey[100],
  borderLeft: `1px solid ${
    theme.palette.mode === 'dark'
      ? theme.palette.grey[800]
      : theme.palette.grey[200]
  }`,
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 0,
  flexShrink: 0,
  color: theme.palette.text.primary,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme)
  }),
  ...(!open && {
    ...closedMixin(theme)
  })
}));

const SideView = () => {
  const [sideViewElement, setSideViewElement] = useRecoilState(sideViewState);
  return (
    <Drawer open={!!sideViewElement}>
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
          height: '100%'
        }}
      >
        {sideViewElement && renderElement(sideViewElement)}
      </Box>
    </Drawer>
  );
};

export default SideView;
