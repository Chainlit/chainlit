import { ILLMSettings } from "state/chat";

export const server = "";

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
    body: JSON.stringify({ prompt, settings, userEnv: {} }),
  });

  const completion = await res.text();
  return completion;
};

export const postMessage = async (
  author: string,
  content: string
) => {
  const res = await fetch(`${server}/message`, {
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ sessionId: window.socket!.id, author, content }),
  });

  return res.json();
};

export const getRole = async (chainlitServer: string, accessToken: string, projectId: string) => {
  const res = await fetch(`${chainlitServer}/api/role`, {
    headers: {
      "content-type": "application/json",
      Authorization: accessToken,
    },
    method: "POST",
    body: JSON.stringify({ projectId }),
  });

  return res.json();
}