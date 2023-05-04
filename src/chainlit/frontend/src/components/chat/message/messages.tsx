import { INestedMessage, loadingState } from 'state/chat';
import Message from './message';
import { IElements } from 'state/element';
import { useRecoilValue } from 'recoil';
import { IActions } from 'state/action';

interface Props {
  messages: INestedMessage[];
  elements: IElements;
  actions: IActions;
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

  return (
    <>
      {messages
        .filter((m) => m.content || m.subMessages?.length)
        .map((m, i) => {
          const isLast = i === messages.length - 1;
          const _isRunning =
            isRunning === undefined ? loading && isLast : isRunning && isLast;
          const showAvatar = m.author !== previousAuthor;
          const nextAuthor = messages[i + 1]?.author;
          const showBorder = m.author !== nextAuthor && (!isLast || !!indent);
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
