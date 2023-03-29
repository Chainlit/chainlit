import { ILLMSettings } from "state/chat";

export const server = "http://127.0.0.1:5000";

export const getProjectSettings = async () => {
  const res = await fetch(`${server}/project/settings`, {
    headers: {
      "content-type": "application/json",
    },
    method: "GET",
  });

  return res.json();
};

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
