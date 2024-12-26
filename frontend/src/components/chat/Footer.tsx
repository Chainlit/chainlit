import { FileSpec, useChatMessages } from "@chainlit/react-client";
import MessageComposer from "./MessageComposer";
import { cn, hasMessage } from "@/lib/utils";
import WaterMark from "@/components/WaterMark";
import ScrollDownButton from "./ScrollDownButton";
import { useLayoutMaxWidth } from "@/hooks/useLayoutMaxWidth";

interface Props {
    fileSpec: FileSpec;
    onFileUpload: (payload: File[]) => void;
    onFileUploadError: (error: string) => void;
    setAutoScroll: (autoScroll: boolean) => void;
    autoScroll: boolean;
  }

export default function ChatFooter({autoScroll, ...props}: Props) {
  const {messages} = useChatMessages()
  const layoutMaxWidth = useLayoutMaxWidth();
 

    if(!hasMessage(messages)) return null

    return          <div className='flex flex-col mx-auto w-full p-4 md:p-2'
    style={{
      "maxWidth": layoutMaxWidth
    }}>
    <div className={cn("relative flex flex-col items-center gap-2 w-full"
    )}
    >
             {!autoScroll ? (
          <ScrollDownButton onClick={() => props.setAutoScroll(true)} />
        ) : null}
        <MessageComposer {...props} />
        <WaterMark />
    </div>
    </div>
}