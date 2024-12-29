import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Translator, { useTranslation } from 'components/i18n/Translator'
import { ProviderButton } from "./ProviderButton"
import { useFormik } from "formik"
import * as yup from 'yup'
import { useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import Alert from "./Alert"

interface Props {
  error?: string;
  providers: string[];
  callbackUrl: string;
  onPasswordSignIn?: (
    email: string,
    password: string,
    callbackUrl: string
  ) => Promise<any>;
  onOAuthSignIn?: (provider: string, callbackUrl: string) => Promise<any>;
}

export function LoginForm({
  providers,
  onPasswordSignIn,
  onOAuthSignIn,
  callbackUrl,
  error
}: Props) {
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(error);
  const [showPassword, setShowPassword] = useState(false);

  const { t } = useTranslation();

  useEffect(() => {
    setErrorState(error);
  }, [error]);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: yup.object({
      email: yup
        .string()
        .required(t('components.molecules.auth.authLogin.form.emailRequired')),
      password: yup
        .string()
        .required(t('components.molecules.auth.authLogin.form.passwordRequired'))
    }),
    onSubmit: async ({ email, password }) => {
      if (!onPasswordSignIn) return;
      
      setLoading(true);
      try {
        await onPasswordSignIn(email, password, callbackUrl);
      } catch (err) {
        if (err instanceof Error) {
          setErrorState(err.message);
        }
      } finally {
        setLoading(false);
      }
    }
  });

  const oAuthReady = onOAuthSignIn && providers.length;

  return (
    <form onSubmit={formik.handleSubmit} className={cn("flex flex-col gap-6")}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">
          <Translator path="components.molecules.auth.authLogin.title" />
        </h1>
      </div>

      {errorState && (
        <Alert variant="error">
            {t([
              `components.molecules.auth.authLogin.error.${errorState.toLowerCase()}`,
              `components.molecules.auth.authLogin.error.default`
            ])}
        </Alert>
      )}

      <div className="grid gap-6">
        {onPasswordSignIn && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="email">
                <Translator path="components.molecules.auth.authLogin.form.email" />
              </Label>
              <Input
                id="email"
                placeholder="m@example.com"
                {...formik.getFieldProps('email')}
                className={cn(
                  formik.touched.email && formik.errors.email && "border-destructive"
                )}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-sm text-destructive">{formik.errors.email}</p>
              )}
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">
                  <Translator path="components.molecules.auth.authLogin.form.password" />
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...formik.getFieldProps('password')}
                  className={cn(
                    formik.touched.password && formik.errors.password && "border-destructive"
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="text-sm text-destructive">{formik.errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <Translator path="components.molecules.auth.authLogin.form.continue" />
            </Button>
          </>
        )}

        {onPasswordSignIn && oAuthReady ? (
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">
              <Translator path="components.molecules.auth.authLogin.form.or" />
            </span>
          </div>
        ): null}

        {oAuthReady ? (
          <div className="grid gap-2">
            {providers.map((provider, index) => (
              <ProviderButton
                key={`provider-${index}`}
                provider={provider}
                onClick={() => onOAuthSignIn?.(provider, callbackUrl)}
              />
            ))}
          </div>
        ): null}
      </div>
    </form>
  )
}