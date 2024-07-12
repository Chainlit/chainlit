import { MessageContext } from 'contexts/MessageContext';
import { memo, useContext } from 'react';

import { useConfig } from '@chainlit/react-client';

import { type IAction, type IMessageElement, type IStep } from 'client-types/';

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

const hasToolStep = (step: IStep): boolean => {
  return (
    step.steps?.some(
      (s) => s.type === 'tool' || s.type.includes('message') || hasToolStep(s)
    ) || false
  );
};

const Messages = memo(
  ({ messages, elements, actions, indent, isRunning, scorableRun }: Props) => {
    const messageContext = useContext(MessageContext);
    const { config } = useConfig();
    return (
      <>
        {messages.map((m) => {
          if (CL_RUN_NAMES.includes(m.name)) {
            const isRunning = !m.end && !m.isError && messageContext.loading;
            const showLoader =
              config?.ui.cot === 'tool_call'
                ? isRunning && !hasToolStep(m)
                : !m.steps?.length && isRunning;
            return (
              <>
                {m.steps?.length ? (
                  <Messages
                    messages={m.steps}
                    elements={elements}
                    actions={actions}
                    indent={indent}
                    isRunning={isRunning}
                    scorableRun={
                      !isRunning && m.name !== 'on_chat_start' ? m : undefined
                    }
                  />
                ) : null}
                <MessageLoader show={showLoader} />
              </>
            );
          } else {
            return (
              <Message
                message={m}
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
