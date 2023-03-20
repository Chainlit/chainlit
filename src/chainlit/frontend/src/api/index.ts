import io from "socket.io-client";
import { ILLMSettings } from "state/chat";

const server = "http://127.0.0.1:5000";

export const socket = io(server);

export const getCompletion = async (prompt: string, settings: ILLMSettings) => {
  const res = await fetch(`${server}/completion`, {
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ prompt, settings }),
  });

  const completion = await res.text();
  return completion;
};
