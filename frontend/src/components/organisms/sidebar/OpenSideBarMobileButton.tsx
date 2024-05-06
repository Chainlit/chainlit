import { useSetRecoilState } from 'recoil';

import SortIcon from '@mui/icons-material/Sort';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import { settingsState } from 'state/settings';

const OpenSideBarMobileButton = () => {
  const setSettings = useSetRecoilState(settingsState);
  return (
    <Box>
      <IconButton
        onClick={() =>
          setSettings((prev) => ({
            ...prev,
            isChatHistoryOpen: true
          }))
        }
      >
        <SortIcon />
      </IconButton>
    </Box>
  );
};

export { OpenSideBarMobileButton };
