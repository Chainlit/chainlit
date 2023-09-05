import { GitHub, Google } from '@mui/icons-material';
import Button from '@mui/material/Button';

import { grey } from '../../theme/palette';

const ICONS: { [key: string]: React.ReactNode } = {
  google: <Google />,
  github: <GitHub />
  // microsoft: <Microsoft />
};

export type Provider = 'Google' | 'GitHub' | 'Microsoft';

interface ProviderButtonProps {
  provider: Provider;
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
      startIcon={ICONS[provider.toLowerCase()]}
      onClick={onClick}
      sx={{
        width: '100%',
        textTransform: 'none',
        borderColor: grey[400],
        padding: 1.5,
        paddingLeft: 3,
        justifyContent: 'flex-start'
      }}
    >{`${isSignIn ? 'Continue' : 'Sign up'} with ${provider}`}</Button>
  );
};

export default ProviderButton;
