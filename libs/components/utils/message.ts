import isEqual from 'lodash/isEqual';

import { IMessageElement } from 'src/types/element';
import { IMessage, IMessageContent, INestedMessage } from 'src/types/message';

const addToParent = (
  parentId: string | undefined,
  child: INestedMessage,
  nestedMessages: INestedMessage[],
  lookup: Record<string, INestedMessage>
): void => {
  if (parentId) {
    const parent = lookup[parentId];
    if (!parent) return;
    if (!parent.subMessages) parent.subMessages = [];
    parent.subMessages.push(child);
  } else {
    nestedMessages.push(child);
  }
};

// Nest messages based on parent id
const nestMessages = (messages: IMessage[]): INestedMessage[] => {
  const nestedMessages: INestedMessage[] = [];
  const lookup: Record<string, INestedMessage> = {};

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

    addToParent(message.parentId, nestedMessage, nestedMessages, lookup);
  }
  return legacyNestMessages(nestedMessages);
};

// Nest messages based on deprecated indent parameter
const legacyNestMessages = (messages: INestedMessage[]): INestedMessage[] => {
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
};

const isLastMessage = (messages: INestedMessage[], index: number) => {
  if (messages.length - 1 === index) {
    return true;
  }

  for (let i = index + 1; i < messages.length; i++) {
    if (messages[i].streaming) {
      continue;
    } else {
      return false;
    }
  }

  return true;
};

// <MessageContent/>

const isForIdMatch = (
  id: string | number | undefined,
  forIds: string[] | undefined
) => {
  if (!forIds || !forIds.length || !id) {
    return false;
  }

  return forIds.includes(id.toString());
};

const isGlobalMatch = (forIds: string[] | undefined) => {
  return !forIds || !forIds.length;
};

const escapeRegExp = (string: string) => {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const prepareContent = ({ elements, message }: IMessageContent) => {
  const elementNames = elements.map((e) => escapeRegExp(e.name));

  // Sort by descending length to avoid matching substrings
  elementNames.sort((a, b) => b.length - a.length);

  const elementRegexp = elementNames.length
    ? new RegExp(`(${elementNames.join('|')})`, 'g')
    : undefined;

  let preparedContent = message.content ? message.content.trim() : '';
  const inlinedElements = elements.filter(
    (e) => isForIdMatch(message.id, e?.forIds) && e.display === 'inline'
  );
  const refElements: IMessageElement[] = [];

  if (elementRegexp) {
    preparedContent = preparedContent.replaceAll(elementRegexp, (match) => {
      const element = elements.find((e) => {
        const nameMatch = e.name === match;
        const scopeMatch =
          isGlobalMatch(e?.forIds) || isForIdMatch(message.id, e?.forIds);
        return nameMatch && scopeMatch;
      });
      const foundElement = !!element;

      const inlined = element?.display === 'inline';
      if (!foundElement) {
        // Element reference does not exist, return plain text
        return match;
      } else if (inlined) {
        // If element is inlined, add it to the list and return plain text
        if (inlinedElements.indexOf(element) === -1) {
          inlinedElements.push(element);
        }
        return match;
      } else {
        // Element is a reference, add it to the list and return link
        refElements.push(element);
        // spaces break markdown links. The address in the link is not used anyway
        return `[${match}](${match.replaceAll(' ', '_')})`;
      }
    });
  }

  if (message.language) {
    preparedContent = `\`\`\`${message.language}\n${preparedContent}\n\`\`\``;
  }
  return {
    preparedContent,
    inlinedElements,
    refElements
  };
};

// Nested messages utils

const addNestedMessage = (
  nestedMessages: INestedMessage[],
  message: IMessage
): INestedMessage[] => {
  if (hasMessageById(nestedMessages, message.id)) {
    return updateMessageById(nestedMessages, message.id, message);
  } else if (message.parentId) {
    return addMessageToParent(nestedMessages, message.parentId, message);
  } else {
    return [...nestedMessages, message];
  }
};

const addMessageToParent = (
  messages: INestedMessage[],
  parentId: string,
  newMessage: IMessage
) => {
  const nextMessages = [...messages];

  for (let index = 0; index < nextMessages.length; index++) {
    const msg = nextMessages[index];

    if (isEqual(msg.id, parentId)) {
      msg.subMessages = msg.subMessages
        ? [...msg.subMessages, newMessage]
        : [newMessage];
      nextMessages[index] = { ...msg };
    } else if (hasMessageById(nextMessages, parentId) && msg.subMessages) {
      msg.subMessages = addMessageToParent(
        msg.subMessages,
        parentId,
        newMessage
      );
      nextMessages[index] = { ...msg };
    }
  }

  return nextMessages;
};

const hasMessageById = (messages: INestedMessage[], messageId: string) => {
  for (const message of messages) {
    if (isEqual(message.id, messageId)) {
      return true;
    } else if (message.subMessages) {
      return hasMessageById(message.subMessages, messageId);
    }
  }
  return false;
};

const updateMessageById = (
  messages: INestedMessage[],
  messageId: string,
  updatedMessage: IMessage
): INestedMessage[] => {
  const nextMessages = [...messages];

  for (let index = 0; index < nextMessages.length; index++) {
    const msg = nextMessages[index];

    if (isEqual(msg.id, messageId)) {
      nextMessages[index] = { ...updatedMessage };
    } else if (hasMessageById(nextMessages, messageId) && msg.subMessages) {
      msg.subMessages = updateMessageById(
        msg.subMessages,
        messageId,
        updatedMessage
      );
      nextMessages[index] = { ...msg };
    }
  }

  return nextMessages;
};

const deleteMessageById = (messages: INestedMessage[], messageId: string) => {
  let nextMessages = [...messages];

  for (let index = 0; index < nextMessages.length; index++) {
    const msg = nextMessages[index];

    if (msg.id === messageId) {
      nextMessages = [
        ...nextMessages.slice(0, index),
        ...nextMessages.slice(index + 1)
      ];
    } else if (hasMessageById(nextMessages, messageId) && msg.subMessages) {
      msg.subMessages = deleteMessageById(msg.subMessages, messageId);
      nextMessages[index] = { ...msg };
    }
  }

  return nextMessages;
};

const updateMessageContentById = (
  messages: INestedMessage[],
  messageId: number | string,
  updatedContent: string,
  isSequence: boolean
): INestedMessage[] => {
  const nextMessages = [...messages];

  for (let index = 0; index < nextMessages.length; index++) {
    const msg = nextMessages[index];

    if (isEqual(msg.id, messageId)) {
      if (isSequence) {
        msg.content = updatedContent;
      } else {
        msg.content += updatedContent;
      }

      nextMessages[index] = { ...msg };
    } else if (msg.subMessages) {
      msg.subMessages = updateMessageContentById(
        msg.subMessages,
        messageId,
        updatedContent,
        isSequence
      );
      nextMessages[index] = { ...msg };
    }
  }

  return nextMessages;
};

export {
  addMessageToParent,
  addNestedMessage,
  deleteMessageById,
  hasMessageById,
  isLastMessage,
  legacyNestMessages,
  nestMessages,
  prepareContent,
  updateMessageById,
  updateMessageContentById
};
