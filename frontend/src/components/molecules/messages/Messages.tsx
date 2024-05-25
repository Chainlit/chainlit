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

    const filtered = messages.filter((m, i) => {
      const content = m.output;
      const hasContent = !!content;
      const hasInlinedElement = elements.find(
        (el) => el.display === 'inline' && el.forId === m.id
      );
      const hasChildren = !!m.steps?.length;
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
          const previousMessage = i > 0 ? filtered[i - 1] : undefined;
          const typeIsDifferent = previousMessage?.type !== m.type;
          const authorIsDifferent =
            !!m.name &&
            !!previousMessage?.name &&
            previousMessage.name !== m.name;
          const showAvatar = typeIsDifferent || authorIsDifferent;

          const isLast = filtered.length - 1 === i;
          let messageRunning =
            isRunning === undefined ? messageContext.loading : isRunning;
          if (isRoot) {
            messageRunning = messageRunning && isLast;
          }
          return (
            <Message
              message={m}
              showAvatar={showAvatar}
              elements={elements}
              actions={actions}
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
