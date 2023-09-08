import { GitHub, Google, Microsoft } from '@mui/icons-material';
import { Box, Button } from '@mui/material';

import { grey } from '../../theme/palette';

function getProviderName(provider: string) {
  switch (provider) {
    case 'azure-ad':
      return 'Microsoft Account';
    default:
      return provider;
  }
}

function renderProviderIcon(provider: string) {
  switch (provider) {
    case 'google':
      return <Google />;
    case 'github':
      return <GitHub />;
    case 'azure-ad':
      return <Microsoft />;
    default:
      return null;
  }
}

interface ProviderButtonProps {
  provider: string;
  onClick: () => void;
  isSignIn?: boolean;
}

const ProviderButton = ({
  provider,
  onClick,
  isSignIn
}: ProviderButtonProps): JSX.Element => {
  return (
    <Button
      variant="outlined"
      color="inherit"
      startIcon={renderProviderIcon(provider.toLowerCase())}
      onClick={onClick}
      sx={{
        width: '100%',
        textTransform: 'none',
        borderColor: grey[400],
        padding: 1.5,
        paddingLeft: 3,
        justifyContent: 'flex-start',
        whiteSpace: 'pre'
      }}
    >
      {`${isSignIn ? 'Continue' : 'Sign up'} with `}
      <Box component="span" sx={{ textTransform: 'capitalize' }}>
        {getProviderName(provider)}
      </Box>
    </Button>
  );
};

export { ProviderButton };
