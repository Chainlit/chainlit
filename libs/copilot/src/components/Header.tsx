import { Stack } from '@mui/material';

import { Logo } from '@chainlit/app/src/components/atoms/logo';

import NewChatButton from './NewChatButton';

const Header = (): JSX.Element => (
  <Stack
    p={1.5}
    pb={0}
    direction="row"
    alignItems="center"
    justifyContent="space-between"
  >
    <Logo style={{ maxHeight: '25px' }} />
    <NewChatButton />
  </Stack>
);

export default Header;
