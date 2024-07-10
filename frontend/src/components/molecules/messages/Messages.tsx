import { MessageContext } from 'contexts/MessageContext';
import { memo, useContext } from 'react';

import type { IAction, IMessageElement, IStep } from 'client-types/';

import MessageLoader from './Loader';
import { Message } from './Message';

interface Props {
  messages: IStep[];
  elements: IMessageElement[];
  actions: IAction[];
  indent: number;
  isRunning?: boolean;
  scorableRun?: IStep;
}

const CL_RUN_NAMES = ['on_chat_start', 'on_message', 'on_audio_end'];

const Messages = memo(
  ({ messages, elements, actions, indent, isRunning, scorableRun }: Props) => {
    const messageContext = useContext(MessageContext);
    return (
      <>
        {messages.map((m, i) => {
          const previousMessage = i > 0 ? messages[i - 1] : undefined;
          const typeIsDifferent = previousMessage?.type !== m.type;
          const authorIsDifferent =
            !!m.name &&
            !!previousMessage?.name &&
            previousMessage.name !== m.name;
          const showAvatar = typeIsDifferent || authorIsDifferent;

          if (CL_RUN_NAMES.includes(m.name)) {
            const isRunning = !m.end && !m.isError && messageContext.loading;
            return (
              <>
                {m.steps?.length ? (
                  <Messages
                    messages={m.steps}
                    elements={elements}
                    actions={actions}
                    indent={indent}
                    isRunning={isRunning}
                    scorableRun={!isRunning ? m : undefined}
                  />
                ) : null}
                <MessageLoader show={!m.steps?.length && isRunning} />
              </>
            );
          } else {
            return (
              <Message
                message={m}
                showAvatar={showAvatar}
                elements={elements}
                actions={actions}
                key={m.id}
                indent={indent}
                isRunning={isRunning}
                scorableRun={scorableRun}
              />
            );
          }
        })}
      </>
    );
  }
);

export { Messages };
