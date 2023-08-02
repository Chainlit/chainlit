import { useRecoilValue } from 'recoil';

import { IAction } from 'state/action';
import { INestedMessage, loadingState } from 'state/chat';
import { IMessageElement } from 'state/element';

import Message from './message';

interface Props {
  messages: INestedMessage[];
  elements: IMessageElement[];
  actions: IAction[];
  indent: number;
  isRunning?: boolean;
}

export default function Messages({
  messages,
  elements,
  actions,
  indent,
  isRunning
}: Props) {
  const loading = useRecoilValue(loadingState);
  let previousAuthor = '';
  const filtered = messages.filter((m, i) => {
    const hasContent = !!m.content;
    const hasChildren = !!m.subMessages?.length;
    const isLast = i === messages.length - 1;
    const _isRunning =
      isRunning === undefined ? loading && isLast : isRunning && isLast;
    return hasContent || hasChildren || (!hasContent && _isRunning);
  });
  return (
    <>
      {filtered.map((m, i) => {
        const isLast = i === filtered.length - 1;
        const _isRunning =
          isRunning === undefined ? loading && isLast : isRunning && isLast;
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
            key={i}
            indent={indent}
            isRunning={_isRunning}
            isLast={isLast}
          />
        );
      })}
    </>
  );
}
