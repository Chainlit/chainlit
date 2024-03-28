import { useState } from 'react';

import MailOutline from '@mui/icons-material/MailOutline';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { Translator } from 'components/i18n';
import { useTranslation } from 'components/i18n/Translator';

import { AuthTemplate } from './AuthTemplate';

interface AuthVerifyEmailProps {
  email: string;
  onGoBack: () => void;
  onResend: (value: string) => Promise<void>;
}

const AuthVerifyEmail = ({
  email,
  onGoBack,
  onResend
}: AuthVerifyEmailProps): JSX.Element => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { t } = useTranslation();

  const onSubmit = async () => {
    setLoading(true);

    try {
      await onResend(email);
      setSuccess(t('components.molecules.auth.authVerifyEmail.emailSent'));
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthTemplate
      renderLogo={
        <>
          <Box
            sx={{
              border: 3,
              borderColor: 'success.main',
              borderRadius: 50,
              width: 60,
              height: 60,
              display: 'grid',
              placeItems: 'center'
            }}
          >
            <MailOutline color="success" fontSize="large" />
          </Box>
          <Typography fontSize="18px" fontWeight={700} color="text.primary">
            <Translator path="components.molecules.auth.authVerifyEmail.verifyEmail" />
          </Typography>
        </>
      }
    >
      {error ? (
        <Alert sx={{ my: 1 }} severity="error">
          {error}
        </Alert>
      ) : null}

      {success ? (
        <Alert sx={{ my: 1 }} severity="success">
          {success}
        </Alert>
      ) : null}

      <Box display="flex" flexDirection="column" gap={3}>
        <Box>
          <Typography>
            <Translator path="components.molecules.auth.authVerifyEmail.almostThere" />
          </Typography>
          <Typography fontWeight="fontWeightMedium" component="span">
            {email}
          </Typography>
        </Box>
        <Typography>
          <Translator path="components.molecules.auth.authVerifyEmail.verifyEmailLink" />
        </Typography>

        <Typography>
          <Translator path="components.molecules.auth.authVerifyEmail.didNotReceive" />
        </Typography>
      </Box>

      <Button
        onClick={onSubmit}
        color="success"
        variant="outlined"
        sx={{ marginTop: 1 }}
        disabled={loading}
      >
        <Translator path="components.molecules.auth.authVerifyEmail.resendEmail" />
      </Button>

      <Link component="button" marginTop={1} onClick={onGoBack}>
        <Translator path="components.molecules.auth.authVerifyEmail.goBack" />
      </Link>
    </AuthTemplate>
  );
};

export { AuthVerifyEmail };
