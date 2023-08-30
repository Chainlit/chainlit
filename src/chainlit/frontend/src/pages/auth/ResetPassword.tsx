import { useFormik } from 'formik';
import * as yup from 'yup';

import Button from '@mui/material/Button';

import Template from './components/Template';
import Link from 'components/atoms/Link';
import TextInput from 'components/organisms/inputs/textInput';

const ResetPassword = (): JSX.Element => {
  const formik = useFormik({
    initialValues: {
      email: ''
    },
    validationSchema: yup.object({
      email: yup.string().required()
    }),
    onSubmit: async () => undefined
  });

  return (
    <Template
      title="Forgot your password?"
      content="Enter your email address and we will send you instructions to reset your password."
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
      <Button
        variant="contained"
        sx={{ marginTop: 1 }}
        onClick={() => console.log('Reset password email', formik.values.email)}
      >
        Continue
      </Button>
      <Link marginTop={1} marginX="auto" to="/sign-in">
        Back to Chainlit Cloud
      </Link>
    </Template>
  );
};

export default ResetPassword;
