import { useFormik } from 'formik';
import { useState } from 'react';
import * as yup from 'yup';

import MailOutline from '@mui/icons-material/MailOutline';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';

import { TextInput } from 'components/atoms/inputs/TextInput';
import Translator, { useTranslation } from 'components/i18n/Translator';

import { AuthTemplate } from './AuthTemplate';

interface AuthForgotPasswordProps {
  onGoBack: () => void;
  onContinue: (value: string) => Promise<void>;
}

const AuthForgotPassword = ({
  onGoBack,
  onContinue
}: AuthForgotPasswordProps): JSX.Element => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { t } = useTranslation();

  const formik = useFormik({
    initialValues: {
      email: ''
    },
    validationSchema: yup.object({
      email: yup
        .string()
        .email()
        .required(
          t('components.molecules.auth.authForgotPassword.emailRequired')
        )
    }),
    onSubmit: async ({ email }) => {
      setLoading(true);

      try {
        await onContinue(email);
        setShowConfirmation(true);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
      } finally {
        setLoading(false);
      }
    },
    validateOnBlur: true,
    validateOnChange: false
  });

  return (
    <AuthTemplate
      renderLogo={
        showConfirmation ? (
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
        ) : undefined
      }
      title={
        showConfirmation
          ? t('components.molecules.auth.authForgotPassword.emailSent', {
              email: formik.values.email
            })
          : t('components.molecules.auth.authForgotPassword.enterEmail')
      }
    >
      {error ? (
        <Alert sx={{ my: 1 }} severity="error">
          {error}
        </Alert>
      ) : null}{' '}
      {showConfirmation ? (
        <Button
          onClick={() => formik.handleSubmit()}
          color="success"
          variant="outlined"
          sx={{ marginTop: 1 }}
        >
          <Translator path="components.molecules.auth.authForgotPassword.resendEmail" />
        </Button>
      ) : (
        <form onSubmit={formik.handleSubmit}>
          <TextInput
            id="email"
            placeholder={t(
              'components.molecules.auth.authForgotPassword.email'
            )}
            size="medium"
            value={formik.values.email}
            hasError={!!formik.errors.email}
            description={formik.errors.email}
            onBlur={formik.handleBlur}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              formik.setFieldValue('email', e.target.value)
            }
          />

          <Button
            type="submit"
            disabled={loading}
            variant="contained"
            sx={{ marginTop: 1, width: '100%' }}
          >
            <Translator path="components.molecules.auth.authForgotPassword.continue" />
          </Button>
        </form>
      )}
      <Link component="button" marginTop={1} onClick={onGoBack}>
        <Translator path="components.molecules.auth.authForgotPassword.goBack" />
      </Link>
    </AuthTemplate>
  );
};

export { AuthForgotPassword };
