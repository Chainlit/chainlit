import { Box } from '@mui/material';
import WelcomeScreen from 'components/chat/welcomeScreen';
import Page from 'pages/Page';

export default function Readme() {
  return (
    <Page>
      <Box sx={{ px: 2 }}>
        <WelcomeScreen />
      </Box>
    </Page>
  );
}
