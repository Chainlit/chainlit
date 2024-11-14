import { Stack } from '@mui/material';

// import { Logo } from '@chainlit/app/src/components/atoms/logo';
import AvaiaLogo from 'assets/logo-avaia-full-white.svg?react';

import NewChatButton from './NewChatButton';
import DashboardSidebarButton from './DashboardSidebarButton';
import CloseModalButton from './CloseModalButton';
import MaximizeButton from './MaximizeButton';
import ShareSessionButton from './ShareSessionButton';
import FavoriteSessionButton from './FavoriteSessionButton';
import PrivacyShieldToggle from './privacyShield/PrivacyShieldToggle';

import { WidgetContext } from 'context';
import { useContext, useEffect, useState } from 'react';

import { firstUserInteraction, sessionIdState, useChatData, ChainlitContext } from '@chainlit/react-client';
import { useRecoilValue } from 'recoil';

const sessionTokenKey = 'session_token';

interface Props {
  showClose: boolean;
  noShow: boolean;
}

const Header = ({ showClose, noShow = false }: Props): JSX.Element => {
  const { evoya, accessToken } = useContext(WidgetContext);
  const apiClient = useContext(ChainlitContext);
  const firstUserInt = useRecoilValue(firstUserInteraction);
  const [sessionUuid, setSessionUuid] = useState(evoya?.session_uuid ?? '');
  const sessionId = useRecoilValue(sessionIdState);
  const { loading } = useChatData();

  const getSessionUuid = async () => {
    try {
      const sessionResponse = await apiClient.get(`/chat_session_uuid/${sessionId}/`, accessToken);
      const sessionJson = await sessionResponse.json();
      setSessionUuid(sessionJson.session_uuid);
      // localStorage.setItem(sessionTokenKey, sessionJson.session_uuid);
      document.cookie = `${sessionTokenKey}=${sessionJson.session_uuid};path=/`;
      console.log('session_token', sessionJson.session_uuid);
    } catch (e) {
      return;
    }
  }

  useEffect(() => {
    if (!sessionUuid && firstUserInt && !loading) {
      getSessionUuid();
      window.dispatchEvent(new CustomEvent('reload-chat-sidebar'));
    }
  }, [firstUserInt, loading]);

  if (noShow) {
    return (<></>);
  }

  return (
    <Stack
      pl={2}
      pr={3}
      py={1.5}
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      bgcolor={evoya?.type === 'dashboard' ? 'background.default' : 'primary.main'}
      borderBottom={evoya?.type === 'dashboard' ? '1px solid background.paper' : '0'}
      className="header-bar"
      sx={(theme: any) => ({
        borderBottom: evoya?.type === 'dashboard' ? `1px solid ${theme.palette.background.paper}` : '0'
      })}
    >

      <Stack direction="row" alignItems="center" spacing={2}>
        {evoya?.type === 'dashboard' ? (
          <>
            <DashboardSidebarButton />
            <NewChatButton />
            <PrivacyShieldToggle />
          </>
        ) : (
          evoya?.logo ? <img src={evoya.logo} style={{ height: '25px', width: 'auto' }} /> : <AvaiaLogo style={{ height: '25px', width: 'auto' }} />
        )}
      </Stack>
      <Stack direction="row" alignItems="center" spacing={2}>
        {(evoya?.type === 'dashboard' && sessionUuid) && (
          <>
            <FavoriteSessionButton sessionUuid={sessionUuid} />
            <ShareSessionButton sessionUuid={sessionUuid} />
          </>
        )}
        {['container', 'dashboard'].includes(evoya?.type ?? '') &&
          <>
            {!showClose && <MaximizeButton />}
            {showClose && <CloseModalButton />}
          </>
        }
        {evoya?.type === 'default' &&
          <>
            {showClose && <CloseModalButton />}
          </>
        }
      </Stack>
    </Stack>
  );
};

export default Header;
