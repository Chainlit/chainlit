import { WidgetContext } from 'context';
import { useCallback, useContext } from 'react';
import { useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import { IProjectSettings } from '@chainlit/app/src/state/project';
import {
  IAction,
  IFeedback,
  IStep,
  messagesState,
  updateMessageById,
  useChatData,
  useChatInteract,
  useChatMessages
} from '@chainlit/react-client';

import MessageContainer from './container';

interface MessagesProps {
  autoScroll: boolean;
  projectSettings?: IProjectSettings;
  setAutoScroll: (autoScroll: boolean) => void;
}

const Messages = ({
  autoScroll,
  setAutoScroll
}: MessagesProps): JSX.Element => {
  const { apiClient, accessToken } = useContext(WidgetContext);
  const { elements, askUser, avatars, loading, actions } = useChatData();
  const { messages } = useChatMessages();
  const { callAction } = useChatInteract();
  const setMessages = useSetRecoilState(messagesState);

  const callActionWithToast = useCallback(
    (action: IAction) => {
      const promise = callAction(action);
      if (promise) {
        toast.promise(promise, {
          loading: `Running ${action.name}`,
          success: (res) => {
            if (res.response) {
              return res.response;
            } else {
              return `${action.name} executed successfully`;
            }
          },
          error: (res) => {
            if (res.response) {
              return res.response;
            } else {
              return `${action.name} failed`;
            }
          }
        });
      }
    },
    [callAction]
  );

  const onFeedbackUpdated = useCallback(
    async (message: IStep, onSuccess: () => void, feedback: IFeedback) => {
      try {
        toast.promise(apiClient.setFeedback(feedback, accessToken), {
          loading: 'Updating',
          success: (res) => {
            setMessages((prev) =>
              updateMessageById(prev, message.id, {
                ...message,
                feedback: {
                  ...feedback,
                  id: res.feedbackId
                }
              })
            );
            onSuccess();
            return 'Feedback updated!';
          },
          error: (err) => {
            return <span>{err.message}</span>;
          }
        });
      } catch (err) {
        console.log(err);
      }
    },
    []
  );

  return (
    <MessageContainer
      avatars={avatars}
      loading={loading}
      askUser={askUser}
      actions={actions}
      elements={elements}
      messages={messages}
      autoScroll={autoScroll}
      onFeedbackUpdated={onFeedbackUpdated}
      callAction={callActionWithToast}
      setAutoScroll={setAutoScroll}
    />
  );
};

export default Messages;
