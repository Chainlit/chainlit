import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { toast } from 'sonner';
import { z } from 'zod';

import { useConfig } from '@chainlit/react-client';

import Alert from '@/components/Alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useLayoutMaxWidth } from '@/hooks/useLayoutMaxWidth';

import { userEnvState } from '@/state/user';

const Env = () => {
  const navigate = useNavigate();
  const { config } = useConfig();
  const [userEnv, setUserEnv] = useRecoilState(userEnvState);
  const layoutMaxWidth = useLayoutMaxWidth();
  const { t } = useTranslation();
  const requiredKeys = config?.userEnv || [];

  // Create initial values object
  const initialValues: Record<string, string> = {};
  requiredKeys.forEach((key) => {
    initialValues[key] = userEnv[key] || '';
  });

  // Create dynamic Zod schema based on required keys
  const schemaObject: Record<string, z.ZodString> = {};
  requiredKeys.forEach((key) => {
    schemaObject[key] = z.string().min(1, { message: 'Required' });
  });
  const schema = z.object(schemaObject);

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields }
  } = useForm<FormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(schema),
    mode: 'onBlur'
  });

  const onSubmit = async (values: FormValues) => {
    localStorage.setItem('userEnv', JSON.stringify(values));
    setUserEnv(values);
    toast.success(t('apiKeys.success.saved'));
    navigate('/');
  };

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
              {t('apiKeys.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="info" className="mb-6">
              {t('apiKeys.description')}
            </Alert>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {requiredKeys.map((key) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{key}</Label>
                  <Input
                    id={key}
                    {...register(key)}
                    className={
                      touchedFields[key] && errors[key] ? 'border-red-500' : ''
                    }
                  />
                  {touchedFields[key] && errors[key] && (
                    <p className="text-sm text-red-500">
                      {errors[key]?.message}
                    </p>
                  )}
                </div>
              ))}

              <Button id="submit-env" type="submit" className="w-full mt-4">
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
