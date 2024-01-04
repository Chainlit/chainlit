import { useRecoilState } from 'recoil';

import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import { settingsState } from 'state/settings';

const OpenThreadListButton = () => {
  const [settings, setSettings] = useRecoilState(settingsState);

  return !settings.isChatHistoryOpen ? (
    <Box>
      <IconButton
        sx={{
          borderRadius: 8,
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

export { OpenThreadListButton };
