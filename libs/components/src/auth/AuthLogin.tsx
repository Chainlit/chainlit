import { useFormik } from 'formik';
import { FormEvent, useEffect, useState } from 'react';
import { useToggle } from 'usehooks-ts';
import * as yup from 'yup';

import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Alert,
  Button,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  Typography
} from '@mui/material';

import useWindowLocation from '../hooks/useLocation';

import { grey } from '../../theme/palette';
import { TextInput } from '../inputs/TextInput';
import { AuthTemplate } from './AuthTemplate';
import { Provider, ProviderButton } from './ProviderButton';

const signinErrors: Record<string, string> = {
  default: 'Unable to sign in.',
  signin: 'Try signing in with a different account.',
  oauthsignin: 'Try signing in with a different account.',
  oauthcallbackerror: 'Try signing in with a different account.',
  oauthcreateaccount: 'Try signing in with a different account.',
  emailcreateaccount: 'Try signing in with a different account.',
  callback: 'Try signing in with a different account.',
  oauthaccountnotlinked:
    'To confirm your identity, sign in with the same account you used originally.',
  emailsignin: 'The e-mail could not be sent.',
  credentialssignin:
    'Sign in failed. Check the details you provided are correct.',
  sessionrequired: 'Please sign in to access this page.'
};

const getErrorMessage = (errorType: string | null): string => {
  if (!errorType) {
    return '';
  }
  return signinErrors[errorType.toLowerCase()] ?? signinErrors.default;
};

type AuthLoginProps = {
  title: string;
  providers: string[];
  callbackUrl: string;
  onPasswordSignIn: (
    email: string,
    password: string,
    callbackUrl: string
  ) => Promise<any>;
  onOAuthSignIn: (provider: string, callbackUrl: string) => Promise<any>;
  onSignUp?: (
    email: string,
    password: string,
    callbackUrl: string
  ) => Promise<any>;
  onForgotPassword?: () => Promise<any>;
  renderLogo?: React.ReactElement;
};

const AuthLogin = ({
  title,
  providers,
  callbackUrl,
  onPasswordSignIn,
  onOAuthSignIn,
  onForgotPassword,
  onSignUp,
  renderLogo
}: AuthLoginProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSignIn, toggleShowSignIn] = useToggle(true);
  const [showPassword, toggleShowPassword] = useToggle();
  const location = useWindowLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const errorType = searchParams.get('error');
    setError(getErrorMessage(errorType));
  }, [location]);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: yup.object({
      email: yup.string().required(),
      password: yup.string().required()
    }),
    onSubmit: async () => undefined,
    validateOnBlur: true
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      showSignIn
        ? await onPasswordSignIn(
            formik.values.email,
            formik.values.password,
            callbackUrl
          )
        : onSignUp &&
          (await onSignUp(
            formik.values.email,
            formik.values.password,
            callbackUrl
          ));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthTemplate title={title} renderLogo={renderLogo}>
      {error ? (
        <Alert sx={{ my: 1 }} severity="error">
          {error}
        </Alert>
      ) : null}
      <form onSubmit={handleSubmit}>
        <TextInput
          id="email"
          placeholder="Email adress"
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
          placeholder="Password"
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
        {showSignIn && onForgotPassword ? (
          <Link component="button" marginTop={1} onClick={onForgotPassword}>
            Forgot password?
          </Link>
        ) : null}
        <Button
          type="submit"
          disabled={loading}
          variant="contained"
          sx={{ marginTop: 3, width: '100%' }}
        >
          Continue
        </Button>
      </form>
      {onSignUp ? (
        <Stack direction="row" alignItems="center" gap={0.5} marginTop={1}>
          {showSignIn ? (
            <>
              <Typography>{`${"Don't have an account?"}`}</Typography>
              <Link component="button" onClick={toggleShowSignIn}>
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Typography>{`${'Already have an account?'}`}</Typography>
              <Link component="button" onClick={toggleShowSignIn}>
                Sign In
              </Link>
            </>
          )}
        </Stack>
      ) : null}
      {providers.length ? (
        <>
          <Typography
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
            OR
          </Typography>
          <Stack marginTop={1} gap={1}>
            {providers.map((provider, index) => (
              <ProviderButton
                key={`provider-${index}`}
                provider={provider}
                onClick={() => onOAuthSignIn(provider, callbackUrl)}
              />
            ))}
          </Stack>
        </>
      ) : null}
    </AuthTemplate>
  );
};

export { AuthLogin };
