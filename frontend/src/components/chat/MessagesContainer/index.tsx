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

const generateMockMessages = (count: number): IStep[] => {
  const messages: IStep[] = [];
  for (let i = 0; i < count; i++) {
    messages.push({
      id: `mock_message_${i}_${Math.random()}`, // Уникальный ID обязателен
      name: i % 2 === 0 ? 'User' : 'Assistant', // Чередуем автора
      type: i % 2 === 0 ? 'user_message' : 'assistant_message',
      output: `Это тестовое сообщение номер ${
        i + 1
      }. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      createdAt: new Date().toISOString(),
      // Остальные поля можно оставить пустыми для простого теста
      indent: 0,
      isError: false,
      showInput: false,
      waitForAnswer: false
    });
  }
  return messages;
};

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
      toast.promise(apiClient.setFeedback(feedback, sessionId), {
        loading: t('chat.messages.feedback.status.updating'),
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
    if (threadId) {
      setMessages((prevMessages) => {
        const historyMessages = generateMockMessages(8);

        historyMessages.splice(4, 0, {
          id: `data_table_${Math.random()}`,
          name: 'Database Assistant',
          type: 'tsql', // НАШ НОВЫЙ ТИП
          createdAt: new Date().toISOString(),
          // Поле output теперь содержит объект для таблицы
          output: {
            headers: [
              'ID',
              'Имя пользователя',
              'Роль',
              'Дата регистрации',
              'ID',
              'Имя пользователя',
              'Роль',
              'Дата регистрации',
              'ID',
              'Имя пользователя',
              'Роль',
              'Дата регистрации',
              'ID',
              'Имя пользователя',
              'Роль',
              'Дата регистрации'
            ],
            rows: [
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ],
              [
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15',
                101,
                'alice',
                'Admin',
                '2023-01-15'
              ]
            ]
          },
          // Наше новое опциональное поле с SQL-запросом
          sql: 'SELECT id, username, role, registration_date FROM users ',

          // Стандартные поля
          indent: 0,
          isError: false,
          showInput: false,
          waitForAnswer: false
        });

        if (prevMessages.length > 2) {
          return prevMessages;
        }

        return [...historyMessages, ...prevMessages];
      });
    }
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
