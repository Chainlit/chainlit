import Page from 'pages/Page';

import { Box } from '@mui/material';

import WelcomeScreen from 'components/organisms/chat/welcomeScreen';

export default function Readme() {
  return (
    <Page>
      <Box sx={{ px: 2 }}>
        <WelcomeScreen />
      </Box>
    </Page>
  );
}
