import { isEqual } from 'lodash';

import { IStep } from '..';

const nestMessages = (messages: IStep[]): IStep[] => {
  let nestedMessages: IStep[] = [];

  for (const message of messages) {
    nestedMessages = addMessage(nestedMessages, message);
  }

  return nestedMessages;
};

const isLastMessage = (messages: IStep[], index: number) => {
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

const addMessage = (messages: IStep[], message: IStep): IStep[] => {
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
  messages: IStep[],
  indent: number,
  newMessage: IStep,
  currentIndentation: number = 0
): IStep[] => {
  if (messages.length === 0) {
    return [newMessage];
  }

  const index = messages.length - 1;
  const msg = messages[index];
  const msgSteps = msg.steps || [];

  if (currentIndentation + 1 === indent) {
    // Add message at current indent level
    const updatedMsg = {
      ...msg,
      steps: [...msgSteps, newMessage]
    };
    const nextMessages = [...messages];
    nextMessages[index] = updatedMsg;
    return nextMessages;
  } else {
    // Recurse deeper
    const updatedSteps = addIndentMessage(
      msgSteps,
      indent,
      newMessage,
      currentIndentation + 1
    );

    // Only create new array if steps actually changed
    if (updatedSteps === msgSteps) {
      return messages;
    }

    const nextMessages = [...messages];
    nextMessages[index] = { ...msg, steps: updatedSteps };
    return nextMessages;
  }
};

const addMessageToParent = (
  messages: IStep[],
  parentId: string,
  newMessage: IStep
): IStep[] => {
  let hasChanges = false;

  const nextMessages = messages.map((msg) => {
    if (isEqual(msg.id, parentId)) {
      hasChanges = true;
      return {
        ...msg,
        steps: msg.steps ? [...msg.steps, newMessage] : [newMessage]
      };
    } else if (hasMessageById(messages, parentId) && msg.steps) {
      const updatedSteps = addMessageToParent(msg.steps, parentId, newMessage);
      if (updatedSteps !== msg.steps) {
        hasChanges = true;
        return { ...msg, steps: updatedSteps };
      }
    }
    return msg;
  });

  return hasChanges ? nextMessages : messages;
};

const findMessageById = (
  messages: IStep[],
  messageId: string
): IStep | undefined => {
  for (const message of messages) {
    if (isEqual(message.id, messageId)) {
      return message;
    } else if (message.steps && message.steps.length > 0) {
      const foundMessage = findMessageById(message.steps, messageId);
      if (foundMessage) {
        return foundMessage;
      }
    }
  }
  return undefined;
};

const hasMessageById = (messages: IStep[], messageId: string): boolean => {
  return findMessageById(messages, messageId) !== undefined;
};

const updateMessageById = (
  messages: IStep[],
  messageId: string,
  updatedMessage: IStep
): IStep[] => {
  let hasChanges = false;
  const nextMessages = messages.map((msg) => {
    if (isEqual(msg.id, messageId)) {
      hasChanges = true;
      return { ...msg, ...updatedMessage };
    } else if (msg.steps) {
      const updatedSteps = updateMessageById(
        msg.steps,
        messageId,
        updatedMessage
      );
      if (updatedSteps !== msg.steps) {
        hasChanges = true;
        return { ...msg, steps: updatedSteps };
      }
    }
    return msg;
  });

  return hasChanges ? nextMessages : messages;
};

const deleteMessageById = (messages: IStep[], messageId: string): IStep[] => {
  let hasChanges = false;
  const nextMessages = messages.reduce((acc, msg) => {
    if (msg.id === messageId) {
      hasChanges = true;
      return acc;
    } else if (msg.steps) {
      const updatedSteps = deleteMessageById(msg.steps, messageId);
      if (updatedSteps !== msg.steps) {
        hasChanges = true;
        acc.push({ ...msg, steps: updatedSteps });
        return acc;
      }
    }
    acc.push(msg);
    return acc;
  }, [] as IStep[]);

  return hasChanges ? nextMessages : messages;
};

const updateMessageContentById = (
  messages: IStep[],
  messageId: number | string,
  updatedContent: string,
  isSequence: boolean,
  isInput: boolean
): IStep[] => {
  let hasChanges = false;
  const nextMessages = messages.map((msg) => {
    if (isEqual(msg.id, messageId)) {
      hasChanges = true;
      const newMsg = { ...msg };
      if ('content' in newMsg && newMsg.content !== undefined) {
        if (isSequence) {
          newMsg.content = updatedContent;
        } else {
          newMsg.content += updatedContent;
        }
      } else if (isInput) {
        if ('input' in newMsg && newMsg.input !== undefined) {
          if (isSequence) {
            newMsg.input = updatedContent;
          } else {
            newMsg.input += updatedContent;
          }
        }
      } else {
        if ('output' in newMsg && newMsg.output !== undefined) {
          if (isSequence) {
            newMsg.output = updatedContent;
          } else {
            newMsg.output += updatedContent;
          }
        }
      }
      return newMsg;
    } else if (msg.steps) {
      const updatedSteps = updateMessageContentById(
        msg.steps,
        messageId,
        updatedContent,
        isSequence,
        isInput
      );
      if (updatedSteps !== msg.steps) {
        hasChanges = true;
        return { ...msg, steps: updatedSteps };
      }
    }
    return msg;
  });

  return hasChanges ? nextMessages : messages;
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
