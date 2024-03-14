import { isEqual } from 'lodash';
import type { IMessageElement } from 'src/types';

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
  messages: IStep[],
  parentId: string,
  newMessage: IStep
): IStep[] => {
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

const hasMessageById = (messages: IStep[], messageId: string) => {
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
  messages: IStep[],
  messageId: string,
  updatedMessage: IStep
): IStep[] => {
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

const deleteMessageById = (messages: IStep[], messageId: string) => {
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
  messages: IStep[],
  messageId: number | string,
  updatedContent: string,
  isSequence: boolean
): IStep[] => {
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

const isForIdMatch = (id: string | number | undefined, forId: string) => {
  if (!forId || !id) {
    return false;
  }

  return forId === id.toString();
};

const escapeRegExp = (string: string) => {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const prepareContent = ({
  elements,
  content,
  id,
  language
}: {
  elements: IMessageElement[];
  content?: string;
  id: string;
  language?: string;
}) => {
  const elementNames = elements.map((e) => escapeRegExp(e.name));

  // Sort by descending length to avoid matching substrings
  elementNames.sort((a, b) => b.length - a.length);

  const elementRegexp = elementNames.length
    ? new RegExp(`(${elementNames.join('|')})`, 'g')
    : undefined;

  let preparedContent = content ? content.trim() : '';
  const inlinedElements = elements.filter(
    (e) => isForIdMatch(id, e?.forId) && e.display === 'inline'
  );
  const refElements: IMessageElement[] = [];

  if (elementRegexp) {
    preparedContent = preparedContent.replaceAll(elementRegexp, (match) => {
      const element = elements.find((e) => {
        const nameMatch = e.name === match;
        const scopeMatch = isForIdMatch(id, e?.forId);
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

  if (language) {
    const prefix = `\`\`\`${language}`;
    const suffix = '```';
    if (!preparedContent.startsWith('```')) {
      preparedContent = `${prefix}\n${preparedContent}\n${suffix}`;
    }
  }
  return {
    preparedContent,
    inlinedElements,
    refElements
  };
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
