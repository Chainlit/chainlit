import { useEffect, useRef } from 'react';

import { Box } from '@mui/material';

import { IAction } from 'state/action';
import { IMessage, INestedMessage } from 'state/chat';
import { IMessageElement } from 'state/element';

import Messages from './messages';

interface Props {
  messages: IMessage[];
  elements: IMessageElement[];
  actions: IAction[];
  autoScroll?: boolean;
  setAutoSroll?: (autoScroll: boolean) => void;
}

// Nest messages based on parent id
function nestMessages(messages: IMessage[]): INestedMessage[] {
  const nestedMessages: INestedMessage[] = [];
  const lookup: Record<string, INestedMessage> = {};

  function addToParent(
    parentId: string | undefined,
    child: INestedMessage
  ): void {
    if (parentId) {
      const parent = lookup[parentId];
      if (!parent) return;
      if (!parent.subMessages) parent.subMessages = [];
      parent.subMessages.push(child);
    } else {
      nestedMessages.push(child);
    }
  }

  for (const message of messages) {
    const nestedMessage: INestedMessage = { ...message };
    if (message.id) lookup[message.id] = nestedMessage;
  }

  for (const message of messages) {
    if (!message.id) {
      nestedMessages.push({ ...message });
      continue;
    }

    const nestedMessage = lookup[message.id];
    if (!nestedMessage) continue;

    addToParent(message.parentId, nestedMessage);
  }

  return legacyNestMessages(nestedMessages);
}

// Nest messages based on deprecated indent parameter
function legacyNestMessages(messages: INestedMessage[]): INestedMessage[] {
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

const MessageContainer = ({
  messages,
  elements,
  actions,
  autoScroll,
  setAutoSroll
}: Props) => {
  const ref = useRef<HTMLDivElement>();
  const nestedMessages = nestMessages(messages);

  useEffect(() => {
    if (!ref.current || !autoScroll) {
      return;
    }
    ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages, autoScroll]);

  useEffect(() => {
    if (!ref.current || !setAutoSroll) {
      return;
    }

    const handleScroll = () => {
      if (!ref.current) return;
      const { scrollTop, scrollHeight, clientHeight } = ref.current;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setAutoSroll(atBottom);
    };
    ref.current.addEventListener('scroll', handleScroll);
    return () => {
      ref.current?.removeEventListener('scroll', handleScroll);
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
        elements={elements}
        actions={actions}
      />
    </Box>
  );
};

export default MessageContainer;
