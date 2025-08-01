import { cn } from '@/lib/utils';
import { MessageContext } from 'contexts/MessageContext';
import { memo, useContext } from 'react';

import {
  type IAction,
  type IMessageElement,
  type IStep
} from '@chainlit/react-client';

import { useLayoutMaxWidth } from 'hooks/useLayoutMaxWidth';

import { Messages } from '..';
import { AskActionButtons } from './AskActionButtons';
import { AskFileButton } from './AskFileButton';
import { MessageAvatar } from './Avatar';
import { MessageButtons } from './Buttons';
import { MessageContent } from './Content';
import Step from './Step';
import UserMessage from './UserMessage';

interface Props {
  message: IStep;
  elements: IMessageElement[];
  actions: IAction[];
  indent: number;
  isRunning?: boolean;
  isScorable?: boolean;
  scorableRun?: IStep;
}

const Message = memo(
  ({
    message,
    elements,
    actions,
    isRunning,
    indent,
    isScorable,
    scorableRun
  }: Props) => {
    const { allowHtml, cot, latex, onError } = useContext(MessageContext);
    const layoutMaxWidth = useLayoutMaxWidth();
    const isUserMessage = message.type === 'user_message';
    const isStep = !message.type.includes('message');
    // Only keep tool calls if Chain of Thought is tool_call
    const toolCallSkip =
      isStep && cot === 'tool_call' && message.type !== 'tool';

    const hiddenSkip = isStep && cot === 'hidden';

    const skip = toolCallSkip || hiddenSkip;

    if (skip) {
      if (!message.steps) {
        return null;
      }
      return (
        <Messages
          messages={message.steps}
          elements={elements}
          actions={actions}
          indent={indent}
          isRunning={isRunning}
          scorableRun={scorableRun}
        />
      );
    }

    return (
      <>
        <div data-step-type={message.type} className="step py-2">
          <div
            className="flex flex-col"
            style={{
              maxWidth: indent ? '100%' : layoutMaxWidth
            }}
          >
            <div
              className={cn('flex flex-grow pb-2')}
              id={`step-${message.id}`}
            >
              {/* User message is displayed differently */}
              {isUserMessage ? (
                <div className="flex flex-col flex-grow max-w-full">
                  <UserMessage message={message} elements={elements}>
                    <MessageContent
                      elements={[]}
                      message={message}
                      allowHtml={allowHtml}
                      latex={latex}
                    />
                  </UserMessage>
                </div>
              ) : (
                <div className="ai-message flex gap-4 w-full">
                  {!isStep || !indent ? (
                    <MessageAvatar
                      author={message.metadata?.avatarName || message.name}
                      isError={message.isError}
                    />
                  ) : null}
                  {/* Display the step and its children */}
                  {isStep ? (
                    <Step step={message} isRunning={isRunning}>
                      {message.steps ? (
                        <Messages
                          messages={message.steps.filter(
                            (s) => !s.type.includes('message')
                          )}
                          elements={elements}
                          actions={actions}
                          indent={indent + 1}
                          isRunning={isRunning}
                        />
                      ) : null}
                      <MessageContent
                        elements={elements}
                        message={message}
                        allowHtml={allowHtml}
                        latex={latex}
                      />
                      <MessageButtons message={message} actions={actions} />
                    </Step>
                  ) : (
                    // Display an assistant message
                    <div className="flex flex-col items-start min-w-[150px] flex-grow gap-2">
                      <MessageContent
                        elements={elements}
                        message={message}
                        allowHtml={allowHtml}
                        latex={latex}
                      />

                      <AskFileButton messageId={message.id} onError={onError} />
                      <AskActionButtons
                        actions={actions}
                        messageId={message.id}
                      />

                      <MessageButtons
                        message={message}
                        actions={actions}
                        run={
                          scorableRun && isScorable ? scorableRun : undefined
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Make sure the child assistant messages of a step are displayed at the root level. */}
        {message.steps && isStep ? (
          <Messages
            messages={message.steps.filter((s) => s.type.includes('message'))}
            elements={elements}
            actions={actions}
            indent={0}
            isRunning={isRunning}
            scorableRun={scorableRun}
          />
        ) : null}
        {/* Display the child steps if the message is not a step (usually a user message). */}
        {message.steps && !isStep ? (
          <Messages
            messages={message.steps}
            elements={elements}
            actions={actions}
            indent={indent}
            isRunning={isRunning}
          />
        ) : null}
      </>
    );
  }
);

export { Message };
