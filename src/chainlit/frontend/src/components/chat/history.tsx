import { Box } from "@mui/material";
import { useEffect, useRef } from "react";
import { useRecoilValue } from "recoil";
import { displayStepsState, messagesState } from "state/chat";
import Message from "./message";
import DocumentSideView from "components/document/sideView";
import Home from "./home";

const History = () => {
  const ref = useRef<HTMLDivElement>();
  let messages = useRecoilValue(messagesState);
  const displaySteps = useRecoilValue(displayStepsState);

  if (!displaySteps) {
    messages = messages.filter(
      (m) => m.final || m.error || m.author === "User"
    );
  }

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
        flexGrow={1}
        sx={{
          maxHeight: "100%",
          overflow: "scroll",
        }}
      >
        {messages.map((m, i) => (
          <Message message={m} key={i} />
        ))}
      </Box>
    );
  } else {
    return <Home />;
  }
};

export default History;
