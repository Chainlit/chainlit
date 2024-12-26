import { type IStep, useChatMessages, useConfig } from '@chainlit/react-client';

import { DebugButton } from './DebugButton';
import CopyButton from '@/components/CopyButton';
import { FeedbackButtons } from './FeedbackButtons';

interface Props {
  message: IStep;
  run?: IStep;
}

const MessageButtons = ({ message, run }: Props) => {
  const { config } = useConfig();
  const { firstInteraction } = useChatMessages();

  const isUser = message.type === 'user_message';
  const isAsk = message.waitForAnswer;
  const hasContent = !!message.output;
  const showCopyButton = hasContent && !isUser && !isAsk;

  const showDebugButton =
    !!config?.debugUrl && !!message.threadId && !!firstInteraction;

  const show = showCopyButton || showDebugButton;

  if (!show || message.streaming) {
    return null;
  }

  return (
    <div
    className='-ml-1.5 flex items-center'
      
    >
      {showCopyButton ? <CopyButton content={message.output} /> : null}
      {run ? <FeedbackButtons message={run} /> : null}
      {showDebugButton ? (
        <DebugButton debugUrl={config.debugUrl!} step={message} />
      ) : null}
    </div>
  );
};

export { MessageButtons };
