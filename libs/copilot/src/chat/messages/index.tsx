import { WidgetContext } from 'context';
import { useCallback, useContext } from 'react';
import { useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import {
  ChainlitContext,
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

const Messages = (): JSX.Element => {
  const apiClient = useContext(ChainlitContext);
  const { accessToken } = useContext(WidgetContext);

  const { elements, askUser, loading, actions } = useChatData();
  const { messages } = useChatMessages();
  const { callAction } = useChatInteract();
  const setMessages = useSetRecoilState(messagesState);

  const callActionWithToast = useCallback(
    (action: IAction) => {
      callAction(action);
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

  const onFeedbackDeleted = useCallback(
    async (message: IStep, onSuccess: () => void, feedbackId: string) => {
      try {
        toast.promise(apiClient.deleteFeedback(feedbackId, accessToken), {
          loading: 'Updating',
          success: (_) => {
            setMessages((prev) =>
              updateMessageById(prev, message.id, {
                ...message,
                feedback: undefined
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
      loading={loading}
      askUser={askUser}
      actions={actions}
      elements={elements}
      messages={messages}
      onFeedbackUpdated={onFeedbackUpdated}
      onFeedbackDeleted={onFeedbackDeleted}
      callAction={callActionWithToast}
    />
  );
};

export default Messages;
