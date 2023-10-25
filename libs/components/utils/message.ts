import isEqual from 'lodash/isEqual';

import { IMessageElement } from 'src/types/element';
import { IMessage, IMessageContent } from 'src/types/message';

const nestMessages = (messages: IMessage[]): IMessage[] => {
  let nestedMessages: IMessage[] = [];

  for (const message of messages) {
    nestedMessages = addMessage(nestedMessages, message);
  }

  return nestedMessages;
};

const isLastMessage = (messages: IMessage[], index: number) => {
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

const addMessage = (messages: IMessage[], message: IMessage): IMessage[] => {
  if (hasMessageById(messages, message.id)) {
    return updateMessageById(messages, message.id, message);
  } else if (message.parentId) {
    return addMessageToParent(messages, message.parentId, message);
  } else if (message.indent && message.indent > 0) {
    return addIndentMessage(messages, message.indent, message);
  } else {
    return [...messages, message];
  }
};

const addIndentMessage = (
  messages: IMessage[],
  indent: number,
  newMessage: IMessage,
  currentIndentation: number = 0
): IMessage[] => {
  const nextMessages = [...messages];

  if (nextMessages.length === 0) {
    return [...nextMessages, newMessage];
  } else {
    const index = nextMessages.length - 1;
    const msg = nextMessages[index];
    msg.subMessages = msg.subMessages || [];

    if (currentIndentation + 1 === indent) {
      msg.subMessages = [...msg.subMessages, newMessage];
      nextMessages[index] = { ...msg };

      return nextMessages;
    } else {
      msg.subMessages = addIndentMessage(
        msg.subMessages,
        indent,
        newMessage,
        currentIndentation + 1
      );

      nextMessages[index] = { ...msg };
      return nextMessages;
    }
  }
};

const addMessageToParent = (
  messages: IMessage[],
  parentId: string,
  newMessage: IMessage
): IMessage[] => {
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

const hasMessageById = (messages: IMessage[], messageId: string) => {
  for (const message of messages) {
    if (isEqual(message.id, messageId)) {
      return true;
    } else if (message.subMessages && message.subMessages.length > 0) {
      if (hasMessageById(message.subMessages, messageId)) {
        return true;
      }
    }
  }
  return false;
};

const updateMessageById = (
  messages: IMessage[],
  messageId: string,
  updatedMessage: IMessage
): IMessage[] => {
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

const deleteMessageById = (messages: IMessage[], messageId: string) => {
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
  messages: IMessage[],
  messageId: number | string,
  updatedContent: string,
  isSequence: boolean
): IMessage[] => {
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
  addMessage,
  deleteMessageById,
  hasMessageById,
  isLastMessage,
  nestMessages,
  prepareContent,
  updateMessageById,
  updateMessageContentById
};
