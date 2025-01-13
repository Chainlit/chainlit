import {
  IAction,
  type IStep,
  useChatMessages,
  useConfig
} from '@chainlit/react-client';

import CopyButton from '@/components/CopyButton';

import MessageActions from './Actions';
import { DebugButton } from './DebugButton';
import { FeedbackButtons } from './FeedbackButtons';

interface Props {
  message: IStep;
  actions: IAction[];
  run?: IStep;
}

const MessageButtons = ({ message, actions, run }: Props) => {
  const { config } = useConfig();
  const { firstInteraction } = useChatMessages();

  const isUser = message.type === 'user_message';
  const isAsk = message.waitForAnswer;
  const hasContent = !!message.output;
  const showCopyButton = hasContent && !isUser && !isAsk;

  const messageActions = actions.filter((a) => a.forId === message.id);

  const showDebugButton =
    !!config?.debugUrl && !!message.threadId && !!firstInteraction;

  const show = showCopyButton || showDebugButton || messageActions?.length;

  if (!show || message.streaming) {
    return null;
  }

  return (
    <div className="-ml-1.5 flex items-center flex-wrap">
      {showCopyButton ? <CopyButton content={message.output} /> : null}
      {run ? <FeedbackButtons message={run} /> : null}
      {messageActions.length ? (
        <MessageActions actions={messageActions} />
      ) : null}
      {showDebugButton ? (
        <DebugButton debugUrl={config.debugUrl!} step={message} />
      ) : null}
    </div>
  );
};

export { MessageButtons };
