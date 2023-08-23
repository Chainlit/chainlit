import { useCallback } from 'react';

const KEY = 'chatHistory';
const MAX_SIZE = 50;

export type MessageHistory = {
  messages: { content: string; createdAt: number }[];
};

export default function useLocalChatHistory() {
  const getLocalChatHistory = useCallback(() => {
    const messageHistory = localStorage.getItem(KEY);
    if (messageHistory) {
      return JSON.parse(messageHistory) as MessageHistory[];
    }
    return [];
  }, []);

  const persistChatLocally = useCallback((message: string) => {
    const messageHistory: MessageHistory = {
      messages: [
        {
          content: message,
          createdAt: new Date().getTime()
        }
      ]
    };

    const chatHistory = getLocalChatHistory();

    if (!chatHistory) {
      localStorage.setItem(KEY, JSON.stringify([messageHistory]));
    } else {
      let curr = [messageHistory, ...chatHistory];
      if (curr.length > MAX_SIZE) {
        curr = curr.slice(0, MAX_SIZE);
      }
      localStorage.setItem(KEY, JSON.stringify(curr));
    }
    return [];
  }, []);

  return { persistChatLocally, getLocalChatHistory };
}
