import { memo, useCallback, useState, useEffect } from 'react';
import { Stack, IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

import { Logo } from 'components/atoms/logo';
import ChatProfiles from 'components/molecules/chatProfiles';
import NewChatButton from 'components/molecules/newChatButton';

interface HeaderProps {
  isExpanded?: boolean;
  toggleExpand: () => void;
  toggleChat: () => void;
}

const Header = memo(({ isExpanded: propIsExpanded, toggleExpand, toggleChat }: HeaderProps): JSX.Element => {
  const [localIsExpanded, setLocalIsExpanded] = useState(propIsExpanded);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'updateExpanded') {
        setLocalIsExpanded(event.data.isExpanded);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleExpandClick = useCallback(() => {
    const newIsExpanded = !localIsExpanded;
    setLocalIsExpanded(newIsExpanded);
    toggleExpand();
    window.parent.postMessage({ type: 'toggleExpand', isExpanded: newIsExpanded }, '*');
  }, [localIsExpanded, toggleExpand]);

  const handleCloseClick = useCallback(() => {
    toggleChat();
    window.parent.postMessage({ type: 'toggleChat', isOpen: false }, '*');
  }, [toggleChat]);

  return (
    <Stack
      px={2}
      py={2.5}
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      bgcolor="background.default"
      sx={{
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px'
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Logo style={{ maxHeight: '28px' }} />
      </Stack>
      <Stack 
        direction="row" 
        alignItems="center" 
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <ChatProfiles />
        <NewChatButton />
        <Tooltip title={localIsExpanded ? "Minimize" : "Expand"}>
          <IconButton 
            sx={{ 
              height: '22px', 
              width: '22px',
            }} 
            onClick={handleExpandClick}
          >
            {localIsExpanded ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title='Close'>
          <IconButton 
            sx={{ 
              height: '22px', 
              width: '22px',
            }} 
            onClick={handleCloseClick}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );
});

export { Header };
