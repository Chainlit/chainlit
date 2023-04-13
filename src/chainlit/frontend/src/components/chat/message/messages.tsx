import { INestedMessage, loadingState } from "state/chat";
import Message from "./message";
import { IDocuments } from "state/document";
import { useRecoilValue } from "recoil";

interface Props {
  messages: INestedMessage[];
  documents: IDocuments;
  indent: number;
  isRunning?: boolean;
}

export default function Messages({ messages, documents, indent, isRunning }: Props) {
  const loading = useRecoilValue(loadingState)
  let previousAuthor = "";

  return (
    <>
      {messages.map((m, i) => {
        const showAvatar = m.author !== previousAuthor;
        previousAuthor = m.author;
        const isLast = i === messages.length - 1;
        const _isRunning = isRunning === undefined ? loading && isLast : isRunning && isLast;
        return (
          <Message
            message={m}
            documents={documents}
            showAvatar={showAvatar}
            key={i}
            indent={indent}
            isRunning={_isRunning}
          />
        );
      })}
    </>
  );
}
