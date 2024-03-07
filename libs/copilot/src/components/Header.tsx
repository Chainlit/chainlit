import { Stack } from '@mui/material';

import { Logo } from '@chainlit/app/src/components/atoms/logo';

import ChatProfiles from './ChatProfiles';
import NewChatButton from './NewChatButton';
import CloseModalButton from './CloseModalButton';

interface Props {
  showClose: boolean;
}

const Header = ({ showClose }: Props): JSX.Element => (
  <Stack
    px={2}
    py={1.5}
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    bgcolor="background.paper"
  >
    <Logo style={{ maxHeight: '25px' }} />
    <Stack direction="row" alignItems="center" spacing={1}>
      <ChatProfiles />
      <NewChatButton />
      {showClose && <CloseModalButton />}
    </Stack>
  </Stack>
);

export default Header;
