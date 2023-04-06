import { Box } from "@mui/material";
import { useEffect, useRef } from "react";
import { useRecoilValue } from "recoil";
import { displayStepsState, IDocuments, IMessage } from "state/chat";
import Message from "./message";
import Home from "./home";
import StopButton from "./stopButton";

interface Props {
  messages: IMessage[];
  documents: IDocuments;
}

const Messages = ({ messages, documents }: Props) => {
  const ref = useRef<HTMLDivElement>();
  const displaySteps = useRecoilValue(displayStepsState);

  if (!displaySteps) {
    messages = messages.filter((m) => m.final || m.authorIsUser);
  }

  let previousAuthor = "";

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const children = Array.from(ref.current.children);
    const lastChild = children[children.length - 1];
    if (lastChild) {
      lastChild.scrollIntoView();
    }
  }, [messages]);

  if (messages.length) {
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
        <StopButton />
        {messages.map((m, i) => {
          const showAvatar = m.author !== previousAuthor || m.final;
          previousAuthor = m.author;
          return (
            <Message
              message={m}
              documents={documents}
              showAvatar={showAvatar}
              key={i}
              isLast={i === messages.length - 1}
            />
          );
        })}
      </Box>
    );
  } else {
    return <Home />;
  }
};

export default Messages;
