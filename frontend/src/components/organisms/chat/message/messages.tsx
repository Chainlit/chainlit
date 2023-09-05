import { useRecoilValue } from 'recoil';

import { IMessageElement } from '@chainlit/components';

import { loadingState } from 'state/chat';

import { IAction } from 'types/action';
import { INestedMessage } from 'types/chat';

import Message from './message';

interface Props {
  messages: INestedMessage[];
  elements: IMessageElement[];
  actions: IAction[];
  indent: number;
  isRunning?: boolean;
}

function isLastMessage(messages: INestedMessage[], index: number) {
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
}

export default function Messages({
  messages,
  elements,
  actions,
  indent,
  isRunning
}: Props) {
  const loading = useRecoilValue(loadingState);
  const isRoot = indent === 0;
  let previousAuthor = '';

  const filtered = messages.filter((m, i) => {
    const hasContent = !!m.content;
    const hasChildren = !!m.subMessages?.length;
    const isLast = i === messages.length - 1;
    const messageRunning =
      isRunning === undefined ? loading && isLast : isRunning && isLast;
    return hasContent || hasChildren || (!hasContent && messageRunning);
  });
  return (
    <>
      {filtered.map((m, i) => {
        const isLast = isLastMessage(filtered, i);
        let messageRunning = isRunning === undefined ? loading : isRunning;
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
}
