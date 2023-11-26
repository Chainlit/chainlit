import { apiClient } from 'api';
import { memo, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import {
  IAction,
  IAsk,
  IAvatarElement,
  IFunction,
  IMessage,
  IMessageElement,
  ITool,
  accessTokenState,
  messagesState,
  updateMessageById
} from '@chainlit/react-client';
import { MessageContainer as CMessageContainer } from '@chainlit/react-components';

import { playgroundState } from 'state/playground';
import { highlightMessage, sideViewState } from 'state/project';
import { projectSettingsState } from 'state/project';
import { settingsState } from 'state/settings';

interface Props {
  loading: boolean;
  actions: IAction[];
  elements: IMessageElement[];
  avatars: IAvatarElement[];
  messages: IMessage[];
  askUser?: IAsk;
  autoScroll?: boolean;
  callAction?: (action: IAction) => void;
  setAutoScroll?: (autoScroll: boolean) => void;
}

const MessageContainer = memo(
  ({
    askUser,
    loading,
    avatars,
    actions,
    autoScroll,
    elements,
    messages,
    callAction,
    setAutoScroll
  }: Props) => {
    const accessToken = useRecoilValue(accessTokenState);
    const appSettings = useRecoilValue(settingsState);
    const projectSettings = useRecoilValue(projectSettingsState);
    const setPlayground = useSetRecoilState(playgroundState);
    const setMessages = useSetRecoilState(messagesState);
    const setSideView = useSetRecoilState(sideViewState);
    const highlightedMessage = useRecoilValue(highlightMessage);

    const enableFeedback = !!projectSettings?.dataPersistence;

    const navigate = useNavigate();

    const onPlaygroundButtonClick = useCallback(
      (message: IMessage) => {
        setPlayground((old) => {
          let functions =
            (message.prompt?.settings?.functions as unknown as IFunction[]) ||
            [];
          const tools =
            (message.prompt?.settings?.tools as unknown as ITool[]) || [];
          if (tools.length) {
            functions = [
              ...functions,
              ...tools
                .filter((t) => t.type === 'function')
                .map((t) => t.function)
            ];
          }
          return {
            ...old,
            prompt: message.prompt
              ? {
                  ...message.prompt,
                  functions
                }
              : undefined,
            originalPrompt: message.prompt
              ? {
                  ...message.prompt,
                  functions
                }
              : undefined
          };
        });
      },
      [setPlayground]
    );

    const onFeedbackUpdated = useCallback(
      async (
        message: IMessage,
        feedback: number,
        onSuccess: () => void,
        feedbackComment?: string
      ) => {
        try {
          await toast.promise(
            apiClient.setHumanFeedback(
              message.id,
              feedback,
              feedbackComment,
              accessToken
            ),
            {
              loading: 'Updating...',
              success: 'Feedback updated!',
              error: (err) => {
                return <span>{err.message}</span>;
              }
            }
          );
          setMessages((prev) =>
            updateMessageById(prev, message.id, {
              ...message,
              humanFeedback: feedback,
              humanFeedbackComment: feedbackComment
            })
          );
          onSuccess();
        } catch (err) {
          console.log(err);
        }
      },
      []
    );

    const onElementRefClick = useCallback(
      (element: IMessageElement) => {
        let path = `/element/${element.id}`;

        if (element.display === 'side') {
          setSideView(element);
          return;
        }

        if (element.conversationId) {
          path += `?conversation=${element.conversationId}`;
        }

        return navigate(element.display === 'page' ? path : '#');
      },
      [setSideView, navigate]
    );

    const messageActions = useMemo(
      () =>
        actions.map((action) => ({
          ...action,
          onClick: async () => {
            try {
              callAction?.(action);
            } catch (err) {
              if (err instanceof Error) {
                toast.error(err.message);
              }
            }
          }
        })),
      [actions]
    );

    const onError = useCallback((error: string) => toast.error(error), [toast]);

    // Memoize the context object since it's created on each render.
    // This prevents unnecessary re-renders of children components when no props have changed.
    const memoizedContext = useMemo(() => {
      return {
        askUser,
        allowHtml: projectSettings?.features?.unsafe_allow_html,
        latex: projectSettings?.features?.latex,
        avatars,
        defaultCollapseContent: appSettings.defaultCollapseContent,
        expandAll: appSettings.expandAll,
        hideCot: appSettings.hideCot,
        highlightedMessage,
        loading,
        showFeedbackButtons: enableFeedback,
        uiName: projectSettings?.ui?.name || '',
        onElementRefClick,
        onError,
        onFeedbackUpdated,
        onPlaygroundButtonClick
      };
    }, [
      appSettings.defaultCollapseContent,
      appSettings.expandAll,
      appSettings.hideCot,
      askUser,
      avatars,
      enableFeedback,
      highlightedMessage,
      loading,
      projectSettings?.ui?.name,
      projectSettings?.features?.unsafe_allow_html,
      onElementRefClick,
      onError,
      onFeedbackUpdated,
      onPlaygroundButtonClick
    ]);

    return (
      <CMessageContainer
        actions={messageActions}
        elements={elements}
        messages={messages}
        autoScroll={autoScroll}
        setAutoScroll={setAutoScroll}
        context={memoizedContext}
      />
    );
  }
);

export default MessageContainer;
