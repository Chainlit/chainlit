import { useFormik } from 'formik';
import { useToggle } from 'usehooks-ts';
import * as yup from 'yup';

import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
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
import ProviderButton, { Provider } from './ProviderButton';

const providers: { name: Provider; link: string }[] = [
  {
    name: 'Google',
    link: 'https://www.google.com'
  },
  {
    name: 'GitHub',
    link: 'https://www.github.com'
  },
  {
    name: 'Microsoft',
    link: 'https://www.microsoft.com'
  }
];

type AuthLoginProps = {
  onContinue: (values: Record<string, string>) => void;
  onForgotPassword?: () => void;
  onProvider?: () => void;
  onSignIn?: () => void;
  onSignUp?: () => void;
  isSignIn?: boolean;
  renderLogo?: React.ReactElement;
};

const AuthLogin = ({
  isSignIn = false,
  onContinue,
  onForgotPassword,
  onProvider,
  onSignIn,
  onSignUp,
  renderLogo
}: AuthLoginProps) => {
  const [showPassword, toggleShowPassword] = useToggle();

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: yup.object({
      email: yup.string().required(),
      password: yup.string().required()
    }),
    onSubmit: async () => undefined
  });

  return (
    <AuthTemplate
      title={'Welcome'}
      content={`${
        isSignIn ? 'Sign In' : 'Sign Up'
      } to Chainlit to continue to Chainlit Cloud.`}
      renderLogo={renderLogo}
    >
      <TextInput
        id="email"
        placeholder="Email adress"
        size="medium"
        value={formik.values.email}
        hasError={!!formik.errors.email}
        description={formik.errors.email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          formik.setFieldValue('email', e.target.value)
        }
      />
      <TextInput
        id="password"
        placeholder="Password"
        value={formik.values.password}
        hasError={!!formik.errors.password}
        description={formik.errors.password}
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
      {isSignIn && onForgotPassword ? (
        <Link component="button" marginTop={1} onClick={onForgotPassword}>
          Forgot password?
        </Link>
      ) : null}
      <Button
        variant="contained"
        sx={{ marginTop: 3 }}
        onClick={() => onContinue(formik.values)}
      >
        Continue
      </Button>
      <Stack direction="row" alignItems="center" gap={0.5} marginTop={1}>
        {isSignIn ? (
          <>
            <Typography>{`${"Don't have an account?"}`}</Typography>
            <Link component="button" onClick={onSignUp}>
              Sign Up
            </Link>
          </>
        ) : (
          <>
            <Typography>{`${'Already have an account?'}`}</Typography>
            <Link component="button" onClick={onSignIn}>
              Sign In
            </Link>
          </>
        )}
      </Stack>
      {onProvider ? (
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
                provider={provider.name}
                onClick={onProvider}
              />
            ))}
          </Stack>
        </>
      ) : null}
    </AuthTemplate>
  );
};

export { AuthLogin };
