import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import PasswordChecklist from 'react-password-checklist';
import { useToggle } from 'usehooks-ts';
import * as yup from 'yup';

import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  Typography
} from '@mui/material';

import { grey } from '../../theme/palette';
import { TextInput } from '../inputs/TextInput';
import { AuthTemplate } from './AuthTemplate';
import { ProviderButton } from './ProviderButton';

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

const getErrorMessage = (errorType?: string): string => {
  if (!errorType) {
    return '';
  }
  return signinErrors[errorType.toLowerCase()] ?? signinErrors.default;
};

type AuthLoginProps = {
  title: string;
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
  renderLogo
}: AuthLoginProps) => {
  const [loading, setLoading] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [showSignIn, toggleShowSignIn] = useToggle(true);
  const [showPassword, toggleShowPassword] = useToggle();
  const [errorState, setErrorState] = useState(error);

  useEffect(() => {
    setErrorState(error);
  }, [error]);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: yup.object({
      email: yup.string().required(),
      password: yup.string().required()
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
      {error ? (
        <Alert sx={{ my: 1 }} severity="error">
          {getErrorMessage(errorState)}
        </Alert>
      ) : null}

      <form onSubmit={formik.handleSubmit}>
        <TextInput
          id="email"
          placeholder="Email address"
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

        {!showSignIn && formik.values.password.length ? (
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
            Your password must contain:
            <PasswordChecklist
              rules={['minLength', 'specialChar', 'number', 'capital']}
              minLength={8}
              value={formik.values.password}
              messages={{
                minLength: 'At least 8 characters',
                specialChar: 'A special character',
                number: 'A number',
                capital: 'An upper case letter'
              }}
              onChange={setIsPasswordValid}
            />
          </Box>
        ) : null}

        {showSignIn && onForgotPassword ? (
          <Link href="#" marginTop={1} onClick={onForgotPassword}>
            Forgot password?
          </Link>
        ) : null}
        <Button
          type="submit"
          disabled={loading || (!showSignIn && !isPasswordValid)}
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
      {onOAuthSignIn && providers.length ? (
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
                isSignIn={showSignIn}
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
