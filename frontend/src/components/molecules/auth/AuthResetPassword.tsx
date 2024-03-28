import { useFormik } from 'formik';
import { ReactElement, useState } from 'react';
import * as yup from 'yup';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { TextInput } from 'components/atoms/inputs/TextInput';
import Translator, { useTranslation } from 'components/i18n/Translator';

import { AuthTemplate } from './AuthTemplate';

interface AuthResetPasswordProps {
  callbackUrl: string;
  onResetPassword: (
    email: string,
    token: string,
    callbackUrl: string
  ) => Promise<any>;
  renderLogo?: ReactElement;
  title: string;
  token: string;
}

const AuthResetPassword = ({
  callbackUrl,
  onResetPassword,
  renderLogo,
  title,
  token
}: AuthResetPasswordProps): JSX.Element => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const formik = useFormik({
    initialValues: {
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: yup.object({
      newPassword: yup
        .string()
        .required(
          t('components.molecules.auth.authResetPassword.newPasswordRequired')
        ),
      confirmPassword: yup
        .string()
        .oneOf(
          [yup.ref('newPassword'), undefined],
          t('components.molecules.auth.authResetPassword.passwordsMustMatch')
        )
        .required(
          'components.molecules.auth.authResetPassword.confirmPasswordRequired'
        )
    }),
    onSubmit: async ({ newPassword }) => {
      setLoading(true);
      setError('');

      try {
        await onResetPassword(newPassword, token, callbackUrl);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
      } finally {
        setLoading(false);
      }
    },
    validateOnBlur: true
  });

  return (
    <AuthTemplate renderLogo={renderLogo} title={title}>
      {error ? (
        <Alert sx={{ my: 1 }} severity="error">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={formik.handleSubmit}>
        <TextInput
          id="newPassword"
          placeholder={t(
            'components.molecules.auth.authResetPassword.newPassword'
          )}
          size="medium"
          value={formik.values.newPassword}
          hasError={!!formik.errors.newPassword}
          description={
            formik.touched.newPassword ? formik.errors.newPassword : undefined
          }
          onBlur={formik.handleBlur}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            formik.setFieldValue('newPassword', e.target.value)
          }
          type="password"
        />

        <TextInput
          id="confirmPassword"
          placeholder={t(
            'components.molecules.auth.authResetPassword.confirmPassword'
          )}
          size="medium"
          value={formik.values.confirmPassword}
          hasError={!!formik.errors.confirmPassword}
          description={
            formik.touched.confirmPassword
              ? formik.errors.confirmPassword
              : undefined
          }
          onBlur={formik.handleBlur}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            formik.setFieldValue('confirmPassword', e.target.value)
          }
          type="password"
        />

        <Button
          type="submit"
          disabled={loading}
          variant="contained"
          sx={{ marginTop: 3, width: '100%' }}
        >
          <Translator path="components.molecules.auth.authResetPassword.resetPassword" />
        </Button>
      </form>
    </AuthTemplate>
  );
};

export { AuthResetPassword };
