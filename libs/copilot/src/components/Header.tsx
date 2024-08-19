import { IconButton, Stack } from '@mui/material';

import ExpandIcon from '@chainlit/app/src/assets/expand';
import MinimizeIcon from '@chainlit/app/src/assets/minimize';
import { Logo } from '@chainlit/app/src/components/atoms/logo';

import ChatProfiles from './ChatProfiles';
import NewChatButton from './NewChatButton';

interface Props {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}

const Header = ({ expanded, setExpanded }: Props): JSX.Element => (
  <Stack
    px={2}
    py={1.5}
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    bgcolor="background.paper"
  >
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Logo style={{ maxHeight: '25px' }} />
      <IconButton onClick={() => setExpanded(!expanded)}>
        {expanded ? (
          <MinimizeIcon sx={{ width: 16, height: 16 }} />
        ) : (
          <ExpandIcon sx={{ width: 16, height: 16 }} />
        )}
      </IconButton>
    </Stack>
    <Stack direction="row" alignItems="center" spacing={1}>
      <ChatProfiles />
      <NewChatButton />
    </Stack>
  </Stack>
);

export default Header;
