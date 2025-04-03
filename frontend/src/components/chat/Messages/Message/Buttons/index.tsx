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
  
  // 检查是否有全宽按钮
  const hasFullWidthActions = messageActions.some(a => a.fullWidth);

  const showDebugButton =
    !!config?.debugUrl && !!message.threadId && !!firstInteraction;

  const show = showCopyButton || showDebugButton || messageActions?.length;

  if (!show || message.streaming) {
    return null;
  }

  // 为全宽按钮使用垂直布局
  const containerClass = hasFullWidthActions 
    ? "-ml-1.5 flex flex-col w-full gap-2" 
    : "-ml-1.5 flex items-center flex-wrap";

  return (
    <div className={containerClass}>
      <div className="flex items-center flex-wrap gap-1">
        {showCopyButton ? <CopyButton content={message.output} /> : null}
        {run ? <FeedbackButtons message={run} /> : null}
        {showDebugButton ? (
          <DebugButton debugUrl={config.debugUrl!} step={message} />
        ) : null}
      </div>
      {messageActions.length ? (
        <MessageActions actions={messageActions} />
      ) : null}
    </div>
  );
};

export { MessageButtons };
