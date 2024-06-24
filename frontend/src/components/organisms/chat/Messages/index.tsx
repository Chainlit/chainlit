import { useCallback, useContext } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import {
  ChainlitContext,
  IAction,
  IFeedback,
  IStep,
  accessTokenState,
  messagesState,
  updateMessageById,
  useChatData,
  useChatInteract,
  useChatMessages
} from '@chainlit/react-client';

import { useTranslation } from 'components/i18n/Translator';

import MessageContainer from './container';

const Messages = (): JSX.Element => {
  const apiClient = useContext(ChainlitContext);
  const { elements, askUser, loading, actions } = useChatData();
  const { messages } = useChatMessages();
  const { callAction } = useChatInteract();
  const accessToken = useRecoilValue(accessTokenState);
  const setMessages = useSetRecoilState(messagesState);

  const { t } = useTranslation();

  const callActionWithToast = useCallback(
    (action: IAction) => {
      const promise = callAction(action);
      if (promise) {
        toast.promise(promise, {
          loading: `${t('components.organisms.chat.Messages.index.running')} ${
            action.name
          }`,
          success: (res) => {
            if (res.response) {
              return res.response;
            } else {
              return `${action.name} ${t(
                'components.organisms.chat.Messages.index.executedSuccessfully'
              )}`;
            }
          },
          error: (res) => {
            if (res.response) {
              return res.response;
            } else {
              return `${action.name} ${t(
                'components.organisms.chat.Messages.index.failed'
              )}`;
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
          loading: t('components.organisms.chat.Messages.index.updating'),
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
            return t(
              'components.organisms.chat.Messages.index.feedbackUpdated'
            );
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
          loading: t('components.organisms.chat.Messages.index.updating'),
          success: () => {
            setMessages((prev) =>
              updateMessageById(prev, message.id, {
                ...message,
                feedback: undefined
              })
            );
            onSuccess();
            return t(
              'components.organisms.chat.Messages.index.feedbackUpdated'
            );
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
