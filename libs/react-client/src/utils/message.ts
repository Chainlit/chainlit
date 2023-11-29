import isEqual from 'lodash/isEqual';

import { StepOrMessage } from '..';

const nestMessages = (messages: StepOrMessage[]): StepOrMessage[] => {
  let nestedMessages: StepOrMessage[] = [];

  for (const message of messages) {
    nestedMessages = addMessage(nestedMessages, message);
  }

  return nestedMessages;
};

const isLastMessage = (messages: StepOrMessage[], index: number) => {
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

// Nested messages utils

const addMessage = (
  messages: StepOrMessage[],
  message: StepOrMessage
): StepOrMessage[] => {
  if (hasMessageById(messages, message.id)) {
    return updateMessageById(messages, message.id, message);
  } else if ('parentId' in message && message.parentId) {
    return addMessageToParent(messages, message.parentId, message);
  } else if ('indent' in message && message.indent && message.indent > 0) {
    return addIndentMessage(messages, message.indent, message);
  } else {
    return [...messages, message];
  }
};

const addIndentMessage = (
  messages: StepOrMessage[],
  indent: number,
  newMessage: StepOrMessage,
  currentIndentation: number = 0
): StepOrMessage[] => {
  const nextMessages = [...messages];

  if (nextMessages.length === 0) {
    return [...nextMessages, newMessage];
  } else {
    const index = nextMessages.length - 1;
    const msg = nextMessages[index];
    msg.steps = msg.steps || [];

    if (currentIndentation + 1 === indent) {
      msg.steps = [...msg.steps, newMessage];
      nextMessages[index] = { ...msg };

      return nextMessages;
    } else {
      msg.steps = addIndentMessage(
        msg.steps,
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
  messages: StepOrMessage[],
  parentId: string,
  newMessage: StepOrMessage
): StepOrMessage[] => {
  const nextMessages = [...messages];

  for (let index = 0; index < nextMessages.length; index++) {
    const msg = nextMessages[index];

    if (isEqual(msg.id, parentId)) {
      msg.steps = msg.steps ? [...msg.steps, newMessage] : [newMessage];
      nextMessages[index] = { ...msg };
    } else if (hasMessageById(nextMessages, parentId) && msg.steps) {
      msg.steps = addMessageToParent(msg.steps, parentId, newMessage);
      nextMessages[index] = { ...msg };
    }
  }

  return nextMessages;
};

const hasMessageById = (messages: StepOrMessage[], messageId: string) => {
  for (const message of messages) {
    if (isEqual(message.id, messageId)) {
      return true;
    } else if (message.steps && message.steps.length > 0) {
      if (hasMessageById(message.steps, messageId)) {
        return true;
      }
    }
  }
  return false;
};

const updateMessageById = (
  messages: StepOrMessage[],
  messageId: string,
  updatedMessage: StepOrMessage
): StepOrMessage[] => {
  const nextMessages = [...messages];

  for (let index = 0; index < nextMessages.length; index++) {
    const msg = nextMessages[index];

    if (isEqual(msg.id, messageId)) {
      nextMessages[index] = { steps: msg.steps, ...updatedMessage };
    } else if (hasMessageById(nextMessages, messageId) && msg.steps) {
      msg.steps = updateMessageById(msg.steps, messageId, updatedMessage);
      nextMessages[index] = { ...msg };
    }
  }

  return nextMessages;
};

const deleteMessageById = (messages: StepOrMessage[], messageId: string) => {
  let nextMessages = [...messages];

  for (let index = 0; index < nextMessages.length; index++) {
    const msg = nextMessages[index];

    if (msg.id === messageId) {
      nextMessages = [
        ...nextMessages.slice(0, index),
        ...nextMessages.slice(index + 1)
      ];
    } else if (hasMessageById(nextMessages, messageId) && msg.steps) {
      msg.steps = deleteMessageById(msg.steps, messageId);
      nextMessages[index] = { ...msg };
    }
  }

  return nextMessages;
};

const updateMessageContentById = (
  messages: StepOrMessage[],
  messageId: number | string,
  updatedContent: string,
  isSequence: boolean
): StepOrMessage[] => {
  const nextMessages = [...messages];

  for (let index = 0; index < nextMessages.length; index++) {
    const msg = nextMessages[index];

    if (isEqual(msg.id, messageId)) {
      if ('content' in msg && msg.content !== undefined) {
        if (isSequence) {
          msg.content = updatedContent;
        } else {
          msg.content += updatedContent;
        }
      } else {
        if ('output' in msg && msg.output !== undefined) {
          if (isSequence) {
            msg.output = updatedContent;
          } else {
            msg.output += updatedContent;
          }
        }
      }

      nextMessages[index] = { ...msg };
    } else if (msg.steps) {
      msg.steps = updateMessageContentById(
        msg.steps,
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
  updateMessageById,
  updateMessageContentById
};
