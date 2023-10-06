import Page from 'pages/Page';

import { Box } from '@mui/material';

import WelcomeScreen from 'components/organisms/chat/welcomeScreen';

export default function Readme() {
  return (
    <Page>
      <Box my={2} display="flex" flexGrow={1}>
        <WelcomeScreen />
      </Box>
    </Page>
  );
}
