import { MessageContext } from '@/contexts/MessageContext';
import { useCallback, useContext, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import {
  ChainlitContext,
  IFeedback,
  IMessageElement,
  IStep,
  messagesState,
  sessionIdState,
  sideViewState,
  updateMessageById,
  useChatData,
  useChatInteract,
  useChatMessages,
  useConfig
} from '@chainlit/react-client';

import { Messages } from '@/components/chat/Messages';
import { useTranslation } from 'components/i18n/Translator';

interface Props {
  navigate?: (to: string) => void;
}

const MessagesContainer = ({ navigate }: Props) => {
  const location = useLocation();

  const threadId = useMemo(() => {
    const match = location.pathname.match(/\/thread\/([a-fA-F0-9-]+)/);
    return match ? match[1] : undefined;
  }, [location.pathname]);

  const apiClient = useContext(ChainlitContext);
  const { config } = useConfig();
  const { elements, askUser, loading, actions } = useChatData();
  const { messages } = useChatMessages();
  const { uploadFile: _uploadFile } = useChatInteract();
  const setMessages = useSetRecoilState(messagesState);
  const setSideView = useSetRecoilState(sideViewState);
  const sessionId = useRecoilValue(sessionIdState);

  const { t } = useTranslation();

  const uploadFile = useCallback(
    (file: File, onProgress: (progress: number) => void, parentId?: string) => {
      return _uploadFile(file, onProgress, parentId);
    },
    [_uploadFile]
  );

  const onFeedbackUpdated = useCallback(
    async (message: IStep, onSuccess: () => void, feedback: IFeedback) => {
      // change id message on parent message id
      feedback.forId = messages[0].id;

      toast.promise(apiClient.setFeedback(feedback, sessionId), {
        loading: t('chat.messages.feedback.status.updating'),
        success: () => {
          setMessages((prev) =>
            updateMessageById(prev, message.id, {
              ...message,
              feedback: {
                ...feedback
              }
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
    []
  );

  const onFeedbackDeleted = useCallback(
    async (message: IStep, onSuccess: () => void, feedbackId: string) => {
      toast.promise(apiClient.deleteFeedback(feedbackId), {
        loading: t('chat.messages.feedback.status.updating'),
        success: () => {
          setMessages((prev) =>
            updateMessageById(prev, message.id, {
              ...message,
              feedback: undefined
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
    []
  );

  const onElementRefClick = useCallback(
    (element: IMessageElement) => {
      if (
        element.display === 'side' ||
        (element.display === 'page' && !navigate)
      ) {
        setSideView({ title: element.name, elements: [element] });
        return;
      }

      let path = `/element/${element.id}`;

      if (element.threadId) {
        path += `?thread=${element.threadId}`;
      }

      return navigate?.(element.display === 'page' ? path : '#');
    },
    [setSideView, navigate]
  );

  const onError = useCallback((error: string) => toast.error(error), [toast]);

  const enableFeedback = !!config?.dataPersistence;

  useEffect(() => {
    let ignore = false;

    const fetchHistory = async () => {
      if (!threadId) {
        return;
      }

      try {
        const res = await apiClient.post(
          `/project/thread/${threadId}/history`,
          {}
        );

        const data = await res.json();
        const historyMessages: IStep[] = data.messages || [];

        if (!ignore && historyMessages.length > 0) {
          setMessages(historyMessages);
        }
      } catch (err) {
        if (!ignore) {
          const message = err instanceof Error ? err.message : String(err);
          onError(`Ошибка загрузки истории: ${message}`);
        }
      }
    };

    fetchHistory();

    return () => {
      ignore = true;
    };
  }, [threadId, setMessages]);

  // Memoize the context object since it's created on each render.
  // This prevents unnecessary re-renders of children components when no props have changed.
  const memoizedContext = useMemo(() => {
    return {
      uploadFile,
      askUser,
      allowHtml: config?.features?.unsafe_allow_html,
      latex: config?.features?.latex,
      editable: !!config?.features.edit_message,
      loading,
      showFeedbackButtons: enableFeedback,
      uiName: config?.ui?.name || '',
      cot: config?.ui?.cot || 'hidden',
      onElementRefClick,
      onError,
      onFeedbackUpdated,
      onFeedbackDeleted
    };
  }, [
    askUser,
    enableFeedback,
    loading,
    config?.ui?.name,
    config?.ui?.cot,
    config?.features?.unsafe_allow_html,
    onElementRefClick,
    onError,
    onFeedbackUpdated
  ]);

  return (
    <MessageContext.Provider value={memoizedContext}>
      <Messages
        indent={0}
        isRunning={loading}
        messages={messages}
        elements={elements}
        actions={actions}
      />
    </MessageContext.Provider>
  );
};

export default MessagesContainer;
