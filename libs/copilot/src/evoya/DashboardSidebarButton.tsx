import { Box, Tooltip, Button, IconButton } from '@mui/material';
import ViewSidebarOutlined from '@mui/icons-material/ViewSidebarOutlined';
import useMediaQuery from '@mui/material/useMediaQuery';

import { Translator } from '@chainlit/app/src/components/i18n';

export default function DashboardSidebarButton() {
  const showSidebarButton = useMediaQuery('(max-width: 1199px)');
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('copilot-dashboard-sidebar'));
  };

  if (!showSidebarButton) return null;

  return (
    <Box>
      <IconButton edge="start" id="new-chat-button" onClick={handleClick}>
        <ViewSidebarOutlined sx={{transform: 'scaleX(-1)'}} />
      </IconButton>
    </Box>
  );
}
