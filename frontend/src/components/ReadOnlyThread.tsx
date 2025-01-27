import { MessageContext } from '@/contexts/MessageContext';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import {
  ChainlitContext,
  IAction,
  IFeedback,
  IMessageElement,
  IStep,
  IThread,
  nestMessages,
  sideViewState,
  useApi,
  useConfig
} from '@chainlit/react-client';

import { useLayoutMaxWidth } from 'hooks/useLayoutMaxWidth';

import { ErrorBoundary } from './ErrorBoundary';
import { Loader } from './Loader';
import { Messages } from './chat/Messages';

type Props = {
  id: string;
};

const ReadOnlyThread = ({ id }: Props) => {
  const { config } = useConfig();
  const {
    data: thread,
    error: threadError,
    isLoading
  } = useApi<IThread>(id ? `/project/thread/${id}` : null, {
    revalidateOnFocus: false
  });
  const navigate = useNavigate();
  const setSideView = useSetRecoilState(sideViewState);
  const [steps, setSteps] = useState<IStep[]>([]);
  const apiClient = useContext(ChainlitContext);
  const { t } = useTranslation();
  const layoutMaxWidth = useLayoutMaxWidth();

  useEffect(() => {
    if (!thread) {
      setSteps([]);
      return;
    }
    setSteps(thread.steps);
  }, [thread]);

  useEffect(() => {
    if (threadError) {
      navigate('/');
      toast.error('Failed to load thread: ' + threadError.message);
    }
  }, [threadError]);

  const onFeedbackUpdated = useCallback(
    async (message: IStep, onSuccess: () => void, feedback: IFeedback) => {
      toast.promise(apiClient.setFeedback(feedback), {
        loading: 'Updating',
        success: (res) => {
          setSteps((prev) =>
            prev.map((step) => {
              if (step.id === message.id) {
                return {
                  ...step,
                  feedback: {
                    ...feedback,
                    id: res.feedbackId
                  }
                };
              }
              return step;
            })
          );

          onSuccess();
          return 'Feedback updated!';
        },
        error: (err) => {
          return <span>{err.message}</span>;
        }
      });
    },
    [setSteps]
  );

  const onFeedbackDeleted = useCallback(
    async (message: IStep, onSuccess: () => void, feedbackId: string) => {
      toast.promise(apiClient.deleteFeedback(feedbackId), {
        loading: t('chat.messages.feedback.status.updating'),
        success: () => {
          setSteps((prev) =>
            prev.map((step) => {
              if (step.id === message.id) {
                return {
                  ...step,
                  feedback: undefined
                };
              }
              return step;
            })
          );

          onSuccess();
          return t('chat.messages.feedback.status.updated');
        },
        error: (err) => {
          return <span>{err.message}</span>;
        }
      });
    },
    [setSteps]
  );

  const onElementRefClick = useCallback(
    (element: IMessageElement) => {
      if (element.display === 'side') {
        setSideView({ title: element.name, elements: [element] });
        return;
      }

      let path = `/element/${element.id}`;

      if (element.threadId) {
        path += `?thread=${element.threadId}`;
      }

      return navigate(element.display === 'page' ? path : '#');
    },
    [setSideView, navigate]
  );

  const onError = useCallback((error: string) => toast.error(error), [toast]);

  const elements = thread?.elements || [];
  const actions: IAction[] = [];
  const messages = nestMessages(steps);

  const memoizedContext = useMemo(() => {
    return {
      allowHtml: config?.features?.unsafe_allow_html,
      latex: config?.features?.latex,
      loading: false,
      showFeedbackButtons: !!config?.dataPersistence,
      uiName: config?.ui?.name || '',
      cot: config?.ui?.cot || 'hidden',
      onElementRefClick,
      onError,
      onFeedbackUpdated,
      onFeedbackDeleted
    };
  }, [
    config?.ui?.name,
    config?.ui?.cot,
    config?.features?.unsafe_allow_html,
    onElementRefClick,
    onError,
    onFeedbackUpdated,
    onFeedbackDeleted
  ]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center">
        <Loader className="!size-6" />
      </div>
    );
  }

  if (!thread) {
    return null;
  }

  return (
    <div className="flex w-full flex-col flex-grow relative overflow-y-auto">
      <ErrorBoundary>
        <MessageContext.Provider value={memoizedContext}>
          <div
            className="flex flex-col mx-auto w-full flex-grow p-4"
            style={{
              maxWidth: layoutMaxWidth
            }}
          >
            <Messages
              indent={0}
              messages={messages}
              elements={elements as any}
              actions={actions}
            />
          </div>
        </MessageContext.Provider>
      </ErrorBoundary>
    </div>
  );
};

export { ReadOnlyThread };
