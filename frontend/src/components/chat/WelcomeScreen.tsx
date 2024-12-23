import { FileSpec } from "@chainlit/react-client";
import { Logo } from "../Logo";
import MessageComposer from "./MessageComposer";
import { useLayoutMaxWidth } from 'hooks/useLayoutMaxWidth';

interface Props {
    fileSpec: FileSpec;
    onFileUpload: (payload: File[]) => void;
    onFileUploadError: (error: string) => void;
    setAutoScroll: (autoScroll: boolean) => void;
    autoScroll?: boolean;
  }

export default function WelcomeScreen(props: Props) {
    const layoutMaxWidth = useLayoutMaxWidth();

    return <div className="flex flex-col -mt-[60px] gap-8 w-full flex-grow items-center justify-center welcome-screen mx-auto"
    style={{
        "maxWidth": layoutMaxWidth
      }}
    >
        <Logo className="w-[220px]" />
        <MessageComposer {...props} />
    </div>
}