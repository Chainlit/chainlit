import { useRecoilState } from 'recoil';

import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import { settingsState } from 'state/settings';

const OpenThreadListButton = ({ mode }: { mode: 'mobile' | 'desktop' }) => {
  const [settings, setSettings] = useRecoilState(settingsState);
  const isDesktop = mode === 'desktop';

  return !settings.isChatHistoryOpen ? (
    <Box
      sx={
        isDesktop
          ? {
              zIndex: 1,
              mt: 1,
              ml: 1,
              display: 'none',
              '@media (min-width: 66rem)': {
                position: 'absolute',
                display: 'block'
              }
            }
          : {}
      }
    >
      <IconButton
        sx={{
          borderRadius: isDesktop ? 1 : 8,
          backgroundColor: (theme) => theme.palette.background.paper
        }}
        onClick={() =>
          setSettings((prev) => ({
            ...prev,
            isChatHistoryOpen: true
          }))
        }
      >
        <KeyboardDoubleArrowRightIcon />
      </IconButton>
    </Box>
  ) : null;
};

export default OpenThreadListButton;
