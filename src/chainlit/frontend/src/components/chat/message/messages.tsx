import { INestedMessage } from "state/chat";
import Message from "./message";
import { IDocuments } from "state/document";

interface Props {
  messages: INestedMessage[];
  documents: IDocuments;
  indent: number;
}

export default function Messages({ messages, documents, indent }: Props) {
  let previousAuthor = "";

  return (
    <>
      {messages.map((m, i) => {
        const showAvatar = m.author !== previousAuthor;
        previousAuthor = m.author;
        const isLast = i === messages.length - 1;
        return (
          <Message
            message={m}
            documents={documents}
            showAvatar={showAvatar}
            key={i}
            indent={indent}
            isLast={isLast}
          />
        );
      })}
    </>
  );
}
