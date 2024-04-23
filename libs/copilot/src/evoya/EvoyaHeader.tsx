import { Stack } from '@mui/material';

import { Logo } from '@chainlit/app/src/components/atoms/logo';

import NewChatButton from './NewChatButton';
import CloseModalButton from './CloseModalButton';
import MaximizeButton from './MaximizeButton';
import ShareSessionButton from './ShareSessionButton';
import FavoriteSessionButton from './FavoriteSessionButton';

import { WidgetContext } from 'context';
import { useContext } from 'react';

import { firstUserInteraction } from '@chainlit/react-client';
import { useRecoilValue } from 'recoil';

interface Props {
  showClose: boolean;
}

const Header = ({ showClose }: Props): JSX.Element => {
  const { evoya } = useContext(WidgetContext);
  const firstUserInt = useRecoilValue(firstUserInteraction);

  return (
    <Stack
      px={3}
      py={1.5}
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      bgcolor="background.paper"
    >
      {evoya?.type === 'dashboard' ? (
        <div></div>
      ) : (
        <Logo style={{ maxHeight: '25px' }} />
      )}
      <Stack direction="row" alignItems="center" spacing={2}>
        {(evoya?.type === 'dashboard' && (evoya.session_uuid || firstUserInt)) && (
          <>
            <FavoriteSessionButton />
            <ShareSessionButton />
          </>
        )}
        {evoya?.type !== 'dashboard' &&
          <NewChatButton chat_uuid={evoya?.chat_uuid} />
        }
        {!showClose && <MaximizeButton />}
        {showClose && <CloseModalButton />}
      </Stack>
    </Stack>
  );
};

export default Header;
