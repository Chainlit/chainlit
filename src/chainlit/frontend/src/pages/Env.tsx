import {
  Alert,
  Box,
  Button,
  InputLabel,
  TextField,
  Typography
} from '@mui/material';
import TopBar from 'components/header';
import { useFormik } from 'formik';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import { projectSettingsState } from 'state/project';
import { userEnvState } from 'state/user';
import * as yup from 'yup';

export default function Env() {
  const [userEnv, setUserEnv] = useRecoilState(userEnvState);
  const pSettings = useRecoilValue(projectSettingsState);
  const navigate = useNavigate();

  if (!pSettings?.project?.user_env || !pSettings?.project?.user_env) {
    return null;
  }

  const requiredKeys = pSettings.project?.user_env;

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
      toast.success('Saved successfully');
      navigate('/');
    }
  });

  const renderInput = (key: string) => {
    return (
      <Box key={key} my={2}>
        <InputLabel>{key}</InputLabel>
        <TextField
          fullWidth
          className={key}
          variant="outlined"
          value={formik.values[key]}
          error={!!formik.errors[key]}
          onChange={(e) => formik.setFieldValue(key, e.target.value)}
        />
      </Box>
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
      <TopBar />
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
          Required API keys
        </Typography>
        <Alert severity="info">
          To use this app, the following API keys are required. The keys are
          stored on your device's local storage.
        </Alert>
        <form onSubmit={formik.handleSubmit}>
          {requiredKeys.map((key) => renderInput(key))}
          <Button id="submit-env" fullWidth type="submit" variant="contained">
            Save
          </Button>
        </form>
      </Box>
    </Box>
  );
}
