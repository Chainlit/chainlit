import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import { toast } from 'sonner';
import * as yup from 'yup';

import { Alert, Box, Button, Typography } from '@mui/material';

import { TextInput } from '@chainlit/react-components';

import { Translator } from 'components/i18n';
import { Header } from 'components/organisms/header';

import { projectSettingsState } from 'state/project';
import { userEnvState } from 'state/user';

export default function Env() {
  const [userEnv, setUserEnv] = useRecoilState(userEnvState);
  const pSettings = useRecoilValue(projectSettingsState);

  const navigate = useNavigate();

  const { t } = useTranslation();

  const requiredKeys = pSettings?.userEnv || [];

  const initialValues: Record<string, string> = {};
  const _schema: Record<string, yup.StringSchema> = {};

  requiredKeys.forEach((key) => {
    initialValues[key] = userEnv[key] || '';
    _schema[key] = yup.string().required();
  });

  const schema = yup.object(_schema);

  const formik = useFormik({
    initialValues,
    validationSchema: schema,
    onSubmit: async (values) => {
      localStorage.setItem('userEnv', JSON.stringify(values));
      setUserEnv(values);
      toast.success(t('pages.Env.savedSuccessfully'));
      return navigate('/');
    }
  });

  if (requiredKeys.length === 0) {
    navigate('/');
  }

  const renderInput = (key: string) => {
    const hasError = !!formik.errors[key];

    return (
      <TextInput
        id={key}
        className={key}
        label={key}
        value={formik.values[key]}
        size="medium"
        hasError={hasError}
        description={hasError ? formik.errors[key] : ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          formik.setFieldValue(key, e.target.value)
        }
      />
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1
      }}
    >
      <Header />
      <Box
        id="env"
        display="flex"
        flexDirection="column"
        flexGrow={1}
        gap={2}
        sx={{
          maxWidth: '60rem',
          width: '100%',
          mx: 'auto'
        }}
      >
        <Typography
          mt={5}
          fontSize="18px"
          fontWeight={700}
          color="text.primary"
        >
          <Translator path="pages.Env.requiredApiKeys" />
        </Typography>
        <Alert severity="info">
          <Translator path="pages.Env.requiredApiKeysInfo" />
        </Alert>
        <form onSubmit={formik.handleSubmit}>
          {requiredKeys.map((key) => renderInput(key))}
          <Button
            id="submit-env"
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 1 }}
          >
            Save
          </Button>
        </form>
      </Box>
    </Box>
  );
}
