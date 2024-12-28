import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { toast } from 'sonner';
import * as yup from 'yup';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Alert from '@/components/Alert';
import { useConfig } from '@chainlit/react-client';
import { useLayoutMaxWidth } from '@/hooks/useLayoutMaxWidth';
import { useTranslation } from 'react-i18next';
import { useRecoilState } from 'recoil';
import { userEnvState } from '@/state/user';

const Env = () => {
  const navigate = useNavigate();
  const {config} = useConfig()
  const [userEnv, setUserEnv] = useRecoilState(userEnvState);
  const layoutMaxWidth = useLayoutMaxWidth()
  const {t} = useTranslation()
  const requiredKeys = config?.userEnv || [];

  const initialValues: Record<string, string> = {};
  const validationSchema: Record<string, any> = {};

  requiredKeys.forEach((key, i) => {
    initialValues[key] = userEnv[key] || '';
    validationSchema[key] = yup.string().required('Required');
  });

  const schema = yup.object().shape(validationSchema);

  const formik = useFormik({
    initialValues,
    validationSchema: schema,
    onSubmit: async (values) => {
      localStorage.setItem('userEnv', JSON.stringify(values));
      setUserEnv(values);
      toast.success(t('pages.Env.savedSuccessfully'));
      navigate('/');
    }
  });

  if (requiredKeys.length === 0) {
    navigate('/');
    return null;
  }

  return (
    <div className="flex flex-col flex-grow">
      <div
        className="flex flex-col flex-grow gap-4 mx-auto w-full"
        style={{ maxWidth: layoutMaxWidth }}
      >
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              {t('pages.Env.requiredApiKeys')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="info" className="mb-6">
                {t('pages.Env.requiredApiKeysInfo')}
            </Alert>

            <form onSubmit={formik.handleSubmit} className="space-y-4">
              {requiredKeys.map((key) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{key}</Label>
                  <Input
                    id={key}
                    name={key}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values[key]}
                    className={formik.touched[key] && formik.errors[key] ? "border-red-500" : ""}
                  />
                  {formik.touched[key] && formik.errors[key] && (
                    <p className="text-sm text-red-500">
                      {formik.errors[key]}
                    </p>
                  )}
                </div>
              ))}
              
              <Button
                id="submit-env"
                type="submit"
                className="w-full mt-4"
              >
                Save
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Env;