import { Box } from "@mui/material";
import { useEffect, useRef } from "react";
import { IMessage, INestedMessage } from "state/chat";
import WelcomeScreen from "components/chat/welcomeScreen";
import { IDocuments } from "state/document";
import Messages from "./messages";

interface Props {
  messages: IMessage[];
  documents: IDocuments;
}

function nestMessages(messages: IMessage[]): INestedMessage[] {
  const nestedMessages: INestedMessage[] = [];
  const parentStack: INestedMessage[] = [];

  for (const message of messages) {
    const nestedMessage: INestedMessage = { ...message };
    const messageIndent = message.indent || 0;

    if (messageIndent && !message.authorIsUser && !message.waitForAnswer) {
      while (
        parentStack.length > 0 &&
        (parentStack[parentStack.length - 1].indent || 0) >= messageIndent
      ) {
        parentStack.pop();
      }

      const currentParent = parentStack[parentStack.length - 1];

      if (currentParent) {
        if (!currentParent.subMessages) {
          currentParent.subMessages = [];
        }
        currentParent.subMessages.push(nestedMessage);
      }
    } else {
      nestedMessages.push(nestedMessage);
    }

    parentStack.push(nestedMessage);
  }

  return nestedMessages;
}

const MessageContainer = ({ messages, documents }: Props) => {
  const ref = useRef<HTMLDivElement>();

  const nestedMessages = nestMessages(messages);

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const messages = Array.from(ref.current.querySelectorAll(".message"));
    const lastChild = messages[messages.length - 1];
    if (lastChild) {
      lastChild.scrollIntoView();
    }
  }, [nestedMessages]);

  if (nestedMessages.length) {
    return (
      <Box
        ref={ref}
        position="relative"
        flexGrow={1}
        sx={{
          maxHeight: "100%",
          overflow: "scroll",
        }}
      >
        <Messages indent={0} messages={nestedMessages} documents={documents} />
      </Box>
    );
  } else {
    return <WelcomeScreen />;
  }
};

export default MessageContainer;
