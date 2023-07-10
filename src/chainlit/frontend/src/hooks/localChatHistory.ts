import { useCallback } from 'react';

import { IChat } from 'state/chat';

const KEY = 'chatHistory';
const MAX_SIZE = 50;

export default function useLocalChatHistory() {
  const getLocalChatHistory = useCallback(() => {
    const chatHistory = localStorage.getItem(KEY);
    if (chatHistory) {
      return JSON.parse(chatHistory) as IChat[];
    }
    return [];
  }, []);

  const persistChatLocally = useCallback((message: string) => {
    const chat: IChat = {
      id: 0,
      createdAt: new Date().getTime(),
      messages: [
        {
          content: message,
          author: '',
          createdAt: new Date().getTime()
        }
      ],
      elements: []
    };

    const chatHistory = getLocalChatHistory();

    if (!chatHistory) {
      localStorage.setItem(KEY, JSON.stringify([chat]));
    } else {
      let curr = [chat, ...chatHistory];
      if (curr.length > MAX_SIZE) {
        curr = curr.slice(0, MAX_SIZE);
      }
      localStorage.setItem(KEY, JSON.stringify(curr));
    }
    return [];
  }, []);

  return { persistChatLocally, getLocalChatHistory };
}
