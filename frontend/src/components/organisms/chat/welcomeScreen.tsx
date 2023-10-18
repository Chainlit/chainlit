import { useRecoilValue } from 'recoil';

import { Box } from '@mui/material';

import Markdown from 'components/molecules/markdown';

import { projectSettingsState } from 'state/project';

const WelcomeScreen = () => {
  const pSettings = useRecoilValue(projectSettingsState);

  if (!pSettings?.markdown) {
    return <Box flexGrow={1} />;
  }

  return (
    <Box overflow="auto" flexGrow={1}>
      <Box
        id="welcome-screen"
        sx={{
          p: 2,
          boxSizing: 'border-box',
          maxWidth: '60rem',
          width: '100%',
          mx: 'auto',
          color: 'text.primary',
          lineHeight: '25px',
          fontSize: '1rem',
          fontFamily:
            '-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {pSettings?.markdown ? (
          <Markdown content={pSettings?.markdown} />
        ) : null}
      </Box>
    </Box>
  );
};

export default WelcomeScreen;
