import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import PasswordChecklist, { RuleNames } from 'react-password-checklist';
import { TextInput } from 'src/inputs/TextInput';
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

import { AuthTemplate } from './AuthTemplate';
import { ProviderButton } from './ProviderButton';

const signinErrors: Record<string, string> = {
  default: 'Unable to sign in.',
  signin: 'Try signing in with a different account.',
  oauthsignin: 'Try signing in with a different account.',
  redirect_uri_mismatch:
    'The redirect URI is not matching the oauth app configuration.',
  oauthcallbackerror: 'Try signing in with a different account.',
  oauthcreateaccount: 'Try signing in with a different account.',
  emailcreateaccount: 'Try signing in with a different account.',
  callback: 'Try signing in with a different account.',
  oauthaccountnotlinked:
    'To confirm your identity, sign in with the same account you used originally.',
  emailsignin: 'The e-mail could not be sent.',
  emailverify: 'Please verify your email, a new email has been sent.',
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
      {errorState ? (
        <Alert sx={{ my: 1 }} severity="error">
          {getErrorMessage(errorState)}
        </Alert>
      ) : null}

      {onPasswordSignIn ? (
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
              Your password must contain:
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
      ) : null}

      {onSignUp ? (
        <Stack direction="row" alignItems="center" gap={0.5} marginTop={1}>
          {showSignIn ? (
            <>
              <Typography color="text.primary">{`${"Don't have an account?"}`}</Typography>
              <Link component="button" onClick={toggleShowSignIn}>
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Typography color="text.primary">{`${'Already have an account?'}`}</Typography>
              <Link component="button" onClick={toggleShowSignIn}>
                Sign In
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
          OR
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
