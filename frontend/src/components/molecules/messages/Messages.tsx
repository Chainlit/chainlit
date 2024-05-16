import { MessageContext } from 'contexts/MessageContext';
import { memo, useContext } from 'react';

import type { IAction, IMessageElement, IStep } from 'client-types/';

import { Message } from './Message';

interface Props {
  messages: IStep[];
  elements: IMessageElement[];
  actions: IAction[];
  indent: number;
  isRunning?: boolean;
}

const Messages = memo(
  ({ messages, elements, actions, indent, isRunning }: Props) => {
    const messageContext = useContext(MessageContext);

    const isRoot = indent === 0;
    let previousAuthor = '';

    const filtered = messages.filter((m, i) => {
      const content = m.output;
      const hasContent = !!content;
      const hasInlinedElement = elements.find(
        (el) => el.display === 'inline' && el.forId === m.id
      );
      const hasChildren = !!m.steps?.length && !messageContext.hideCot;
      const isLast = i === messages.length - 1;
      const messageRunning =
        isRunning === undefined
          ? messageContext.loading && isLast
          : isRunning && isLast;
      return (
        hasContent ||
        hasInlinedElement ||
        hasChildren ||
        (!hasContent && messageRunning)
      );
    });

    return (
      <>
        {filtered.map((m, i) => {
          const author = m.name;
          const isLast = filtered.length - 1 === i;
          let messageRunning =
            isRunning === undefined ? messageContext.loading : isRunning;
          if (isRoot) {
            messageRunning = messageRunning && isLast;
          }
          const showAvatar = author !== previousAuthor;
          const showBorder = false;
          previousAuthor = author;
          return (
            <Message
              message={m}
              elements={elements}
              actions={actions}
              showAvatar={showAvatar}
              showBorder={showBorder}
              key={m.id}
              indent={indent}
              isRunning={messageRunning}
              isLast={isLast}
            />
          );
        })}
      </>
    );
  }
);

export { Messages };
