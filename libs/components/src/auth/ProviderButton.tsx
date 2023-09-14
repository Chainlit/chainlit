import { grey } from 'theme/palette';

import { GitHub, Google, Microsoft } from '@mui/icons-material';
import { Button } from '@mui/material';

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getProviderName(provider: string) {
  switch (provider) {
    case 'azure-ad':
      return 'Microsoft';
    case 'github':
      return 'GitHub';
    default:
      return capitalizeFirstLetter(provider);
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
        justifyContent: 'flex-start'
      }}
    >
      {`${isSignIn ? 'Continue' : 'Sign up'} with ${getProviderName(provider)}`}
    </Button>
  );
};

export { ProviderButton };
