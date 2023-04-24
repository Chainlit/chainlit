import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { IMessage, INestedMessage } from "state/chat";
import { IDocuments } from "state/document";
import Messages from "./messages";
import { IActions } from "state/action";

interface Props {
  messages: IMessage[];
  documents: IDocuments;
  actions: IActions;
  autoScroll?: boolean;
  setAutoSroll?: (autoScroll: boolean) => void;
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

const MessageContainer = ({ messages, documents, actions, autoScroll, setAutoSroll }: Props) => {
  const ref = useRef<HTMLDivElement>();
  const nestedMessages = nestMessages(messages);

  useEffect(() => {
    if (!ref.current || !autoScroll) {
      return;
    }
    const messages = Array.from(ref.current.querySelectorAll(".message"));
    const lastChild = messages[messages.length - 1];
    if (lastChild) {
      lastChild.scrollIntoView();
    }
  }, [messages, autoScroll]);

  useEffect(() => {
    if (!ref.current || !setAutoSroll) {
      return;
    }

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = ref.current!;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setAutoSroll(atBottom);
    };
    ref.current.addEventListener("scroll", handleScroll);
    return () => {
      ref.current?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <Box
      ref={ref}
      position="relative"
      display="flex"
      flexDirection="column"
      overflow="auto"
      flexGrow={1}
    >
      <Messages
        indent={0}
        messages={nestedMessages}
        documents={documents}
        actions={actions}
      />
    </Box>
  );
};

export default MessageContainer;
