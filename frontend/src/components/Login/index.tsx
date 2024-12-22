import { LoginForm } from "./LoginForm"
import { Logo } from "@/components/Logo"
import { useContext } from "react";
import {ChainlitContext} from '@chainlit/react-client'

export default function LoginPage() {
    const apiClient = useContext(ChainlitContext);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
        <Logo style={{ maxWidth: '60%', maxHeight: '90px' }} />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src={apiClient.buildEndpoint("/favicon")}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
