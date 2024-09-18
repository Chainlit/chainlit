import { useFormik } from 'formik';
import React, { useEffect, useState } from 'react';
import PasswordChecklist, { RuleNames } from 'react-password-checklist';
import { grey } from 'theme/palette';
import { useToggle } from 'usehooks-ts';
import * as yup from 'yup';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { TextInput } from 'components/atoms/inputs/TextInput';
import Translator, { useTranslation } from 'components/i18n/Translator';

import { AuthTemplate } from './AuthTemplate';
import { ProviderButton } from './ProviderButton';

type AuthLoginProps = {
  title: React.ReactNode | string;
  error?: string;
  providers: string[];
  callbackUrl: string;
  onPasswordSignIn?: (
    email: string,
    password: string,
    callbackUrl: string
  ) => Promise<any>;
  onOAuthSignIn?: (provider: string, callbackUrl: string) => Promise<any>;
  onSignUp?: (
    email: string,
    password: string,
    callbackUrl: string
  ) => Promise<any>;
  onForgotPassword?: () => Promise<any>;
  renderLogo?: React.ReactElement;
  passwordChecklistSettings?: {
    rules: RuleNames[];
    messages?: Partial<Record<RuleNames, string>>;
    minLength?: number;
    maxLength?: number;
  };
};

const AuthLogin = ({
  title,
  error,
  providers,
  callbackUrl,
  onPasswordSignIn,
  onOAuthSignIn,
  onForgotPassword,
  onSignUp,
  renderLogo,
  passwordChecklistSettings
}: AuthLoginProps) => {
  const [loading, setLoading] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(
    !passwordChecklistSettings
  );
  const [showSignIn, toggleShowSignIn] = useToggle(true);
  const [showPassword, toggleShowPassword] = useToggle();
  const [errorState, setErrorState] = useState(error);
  const { t } = useTranslation();

  const oAuthReady = onOAuthSignIn && providers.length;

  useEffect(() => {
    setErrorState(undefined);
    formik.resetForm();
  }, [showSignIn]);
  useEffect(() => {
    setErrorState(error);
  }, [error]);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: yup.object({
      email: yup
        .string()
        .required(t('components.molecules.auth.authLogin.form.emailRequired')),
      password: yup
        .string()
        .required(
          t('components.molecules.auth.authLogin.form.passwordRequired')
        )
    }),
    onSubmit: async ({ email, password }) => {
      setLoading(true);

      if (!onPasswordSignIn) {
        return;
      }

      try {
        showSignIn
          ? await onPasswordSignIn(email, password, callbackUrl)
          : onSignUp && (await onSignUp(email, password, callbackUrl));
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorState(err.message);
        }
      } finally {
        setLoading(false);
      }
    },
    validateOnBlur: true
  });

  return (
    <AuthTemplate title={title} renderLogo={renderLogo}>
      {errorState ? (
        <Alert sx={{ my: 1 }} severity="error">
          {t([
            `components.molecules.auth.authLogin.error.${errorState.toLowerCase()}`,
            `components.molecules.auth.authLogin.error.default`
          ])}
        </Alert>
      ) : null}

      {onPasswordSignIn ? (
        <form onSubmit={formik.handleSubmit}>
          <TextInput
            id="email"
            placeholder={t('components.molecules.auth.authLogin.form.email')}
            size="medium"
            value={formik.values.email}
            hasError={!!formik.errors.email}
            description={formik.touched.email ? formik.errors.email : undefined}
            onBlur={formik.handleBlur}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              formik.setFieldValue('email', e.target.value)
            }
          />
          <TextInput
            id="password"
            placeholder={t('components.molecules.auth.authLogin.form.password')}
            value={formik.values.password}
            hasError={!!formik.errors.password}
            description={
              formik.touched.password ? formik.errors.password : undefined
            }
            onBlur={formik.handleBlur}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              formik.setFieldValue('password', e.target.value)
            }
            type={showPassword ? 'text' : 'password'}
            size="medium"
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={toggleShowPassword}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
          />

          {!showSignIn &&
          formik.values.password.length &&
          passwordChecklistSettings ? (
            <Box
              sx={{
                border: 1,
                marginTop: 1,
                padding: 1.5,
                borderRadius: 1,
                borderColor: 'grey.400',
                '& .checklist-icon': {
                  marginTop: 0.5
                },
                fontSize: 14
              }}
            >
              <Translator path="components.molecules.auth.authLogin.form.passwordMustContain" />
              <PasswordChecklist
                rules={passwordChecklistSettings.rules}
                minLength={passwordChecklistSettings.minLength}
                maxLength={passwordChecklistSettings.maxLength}
                value={formik.values.password}
                messages={passwordChecklistSettings.messages}
                onChange={setIsPasswordValid}
              />
            </Box>
          ) : null}

          {showSignIn && onForgotPassword ? (
            <Link href="#" marginTop={1} onClick={onForgotPassword}>
              <Translator path="components.molecules.auth.authLogin.form.forgotPassword" />
            </Link>
          ) : null}
          <Button
            type="submit"
            disabled={loading || (!showSignIn && !isPasswordValid)}
            variant="contained"
            sx={{ marginTop: 3, width: '100%' }}
          >
            <Translator path="components.molecules.auth.authLogin.form.continue" />
          </Button>
        </form>
      ) : null}

      {onSignUp ? (
        <Stack direction="row" alignItems="center" gap={0.5} marginTop={1}>
          {showSignIn ? (
            <>
              <Typography color="text.primary">
                <Translator path="components.molecules.auth.authLogin.form.noAccount" />
              </Typography>
              <Link component="button" onClick={toggleShowSignIn}>
                <Translator path="components.molecules.auth.authLogin.form.signup" />
              </Link>
            </>
          ) : (
            <>
              <Typography color="text.primary">
                <Translator path="components.molecules.auth.authLogin.form.alreadyHaveAccount" />
              </Typography>
              <Link component="button" onClick={toggleShowSignIn}>
                <Translator path="components.molecules.auth.authLogin.form.signin" />
              </Link>
            </>
          )}
        </Stack>
      ) : null}
      {onPasswordSignIn && oAuthReady ? (
        <Typography
          color="text.primary"
          sx={{
            alignItems: 'center',
            direction: 'row',
            display: 'flex',
            gap: 2,
            marginTop: 1,
            width: '100%',
            ':before, :after': {
              content: '""',
              borderBottom: `1px solid ${grey[400]}`,
              height: '0.5px',
              flex: '1 0 auto'
            }
          }}
        >
          <Translator path="components.molecules.auth.authLogin.form.or" />
        </Typography>
      ) : null}
      {oAuthReady ? (
        <Stack color="text.primary" marginTop={1} gap={1}>
          {providers.map((provider, index) => (
            <ProviderButton
              key={`provider-${index}`}
              isSignIn={showSignIn}
              provider={provider}
              onClick={() => onOAuthSignIn(provider, callbackUrl)}
            />
          ))}
        </Stack>
      ) : null}
    </AuthTemplate>
  );
};

export { AuthLogin };
