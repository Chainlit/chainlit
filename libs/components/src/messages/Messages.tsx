import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';
import { isLastMessage } from 'utils/message';

import { IAction } from 'src/types/action';
import { IMessageElement } from 'src/types/element';
import { INestedMessage } from 'src/types/message';

import { Message } from './Message';

interface Props {
  messages: INestedMessage[];
  elements: IMessageElement[];
  actions: IAction[];
  indent: number;
  isRunning?: boolean;
}

const Messages = ({
  messages,
  elements,
  actions,
  indent,
  isRunning
}: Props) => {
  const messageContext = useContext(MessageContext);

  const isRoot = indent === 0;
  let previousAuthor = '';

  const filtered = messages.filter((m, i) => {
    const hasContent = !!m.content;
    const hasChildren = !!m.subMessages?.length;
    const isLast = i === messages.length - 1;
    const messageRunning =
      isRunning === undefined
        ? messageContext.loading && isLast
        : isRunning && isLast;
    return hasContent || hasChildren || (!hasContent && messageRunning);
  });

  return (
    <>
      {filtered.map((m, i) => {
        const isLast = isLastMessage(filtered, i);
        let messageRunning =
          isRunning === undefined ? messageContext.loading : isRunning;
        if (isRoot) {
          messageRunning = messageRunning && isLast;
        }
        const showAvatar = m.author !== previousAuthor;
        const showBorder = false;
        previousAuthor = m.author;
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
};

export { Messages };
