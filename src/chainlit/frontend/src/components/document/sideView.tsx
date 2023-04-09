import CloseIcon from "@mui/icons-material/Close";
import {
  IconButton,
  Box,
  BoxProps,
  Typography,
  Stack,
} from "@mui/material";
import { styled, Theme, CSSObject } from "@mui/material/styles";
import { renderDocument } from "components/artifact/view";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { documentSideViewState } from "state/chat";

const drawerWidth = 400;

const openedMixin = (theme: Theme): CSSObject => ({
  padding: "1.5rem",
  paddingTop: ".5rem",
  width: drawerWidth,
  transition: theme.transitions.create("transform", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("transform", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: 0,
});

interface DrawerProps extends BoxProps {
  open?: boolean;
}

const Drawer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "open",
})<DrawerProps>(({ theme, open }) => ({
  backgroundColor: theme.palette.background.paper,
  display: "flex",
  flexDirection: "column",
  borderRadius: 0,
  flexShrink: 0,
  color: theme.palette.text.primary,
  // borderLeft: `1px solid ${theme.palette.divider}`,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
  }),
}));

const DocumentSideView = () => {
  const setSideView = useSetRecoilState(documentSideViewState);
  const document = useRecoilValue(documentSideViewState);
  return (
    <Drawer open={!!document}>
      <Stack direction="row" alignItems="center">
        <Typography fontSize="18px">{document?.name}</Typography>
        <IconButton
          edge="end"
          sx={{ ml: "auto" }}
          onClick={() => setSideView(undefined)}
        >
          <CloseIcon />
        </IconButton>
      </Stack>

      <Box mt="1.5rem" id="side-view-content">{document && renderDocument(document)}</Box>
    </Drawer>
  );
};

export default DocumentSideView;
