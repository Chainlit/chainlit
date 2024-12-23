import { FileSpec } from "@chainlit/react-client";
import { Logo } from "../Logo";
import MessageComposer from "./MessageComposer";
import { useLayoutMaxWidth } from 'hooks/useLayoutMaxWidth';
import Starters from "./Starters";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
    fileSpec: FileSpec;
    onFileUpload: (payload: File[]) => void;
    onFileUploadError: (error: string) => void;
    setAutoScroll: (autoScroll: boolean) => void;
    autoScroll?: boolean;
  }

export default function WelcomeScreen(props: Props) {
  const [isVisible, setIsVisible] = useState(false);

    const layoutMaxWidth = useLayoutMaxWidth();

    useEffect(() => {
      setIsVisible(true)
    }, [])


    return <div className={cn("flex flex-col -mt-[60px] gap-6 w-full flex-grow items-center justify-center welcome-screen mx-auto transition-opacity duration-500 opacity-0 delay-100",
    isVisible && 'opacity-100'
    )}
    style={{
        "maxWidth": layoutMaxWidth
      }}
    >
        <Logo className="w-[200px]" />
        <MessageComposer {...props} />
        <Starters />
    </div>
}