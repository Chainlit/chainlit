import { useFormik } from 'formik';
import { grey } from 'palette';
import { useToggle } from 'usehooks-ts';
import * as yup from 'yup';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  Button,
  IconButton,
  InputAdornment,
  Stack,
  Typography
} from '@mui/material';

import Link from 'components/atoms/Link';
import TextInput from 'components/organisms/inputs/textInput';

import ProviderButton, { Provider } from './ProviderButton';
import Template from './Template';

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

type Props = {
  isSignIn?: boolean;
};

const Login = ({ isSignIn = false }: Props) => {
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
    <Template
      title={'Welcome'}
      content={`${
        isSignIn ? 'Sign In' : 'Sign Up'
      } to Chainlit to continue to Chainlit Cloud.`}
    >
      <TextInput
        id="email"
        placeholder="Email adress"
        size="medium"
        value={formik.values.email}
        hasError={!!formik.errors.email}
        description={formik.errors.email}
        onChange={(e) => formik.setFieldValue('email', e.target.value)}
      />
      <TextInput
        id="password"
        placeholder="Password"
        value={formik.values.password}
        hasError={!!formik.errors.password}
        description={formik.errors.password}
        onChange={(e) => formik.setFieldValue('password', e.target.value)}
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
      {isSignIn ? (
        <Link marginTop={1} to="/reset-password">
          Forgot password?
        </Link>
      ) : null}
      <Button
        variant="contained"
        sx={{ marginTop: 3 }}
        onClick={() => console.log('Input values', formik.values)}
      >
        Continue
      </Button>
      <Stack direction="row" alignItems="center" gap={0.5} marginTop={1}>
        {isSignIn ? (
          <>
            <Typography>{`${"Don't have an account?"}`}</Typography>
            <Link to={'/sign-up'}>Sign Up</Link>
          </>
        ) : (
          <>
            <Typography>{`${'Already have an account?'}`}</Typography>
            <Link to={'/sign-in'}>Sign In</Link>
          </>
        )}
      </Stack>
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
            onClick={() => console.log('Clicked on provider', provider)}
          />
        ))}
      </Stack>
    </Template>
  );
};

export default Login;
