import { ChainlitAPI } from 'api/chainlitApi';
import { memo, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import {
  MessageContainer as CMessageContainer,
  IAction,
  IAsk,
  IAvatarElement,
  IFunction,
  IMessage,
  IMessageElement
} from '@chainlit/components';

import { playgroundState } from 'state/playground';
import { highlightMessage, sideViewState } from 'state/project';
import { projectSettingsState } from 'state/project';
import { settingsState } from 'state/settings';
import { accessTokenState } from 'state/user';

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
    const setSideView = useSetRecoilState(sideViewState);
    const highlightedMessage = useRecoilValue(highlightMessage);

    const enableFeedback = !!projectSettings?.dataPersistence;

    const navigate = useNavigate();

    const onPlaygroundButtonClick = useCallback(
      (message: IMessage) => {
        setPlayground((old) => ({
          ...old,
          prompt: message.prompt
            ? {
                ...message.prompt,
                functions:
                  (message.prompt.settings
                    ?.functions as unknown as IFunction[]) || []
              }
            : undefined,
          originalPrompt: message.prompt
            ? {
                ...message.prompt,
                functions:
                  (message.prompt.settings
                    ?.functions as unknown as IFunction[]) || []
              }
            : undefined
        }));
      },
      [setPlayground]
    );

    const onFeedbackUpdated = useCallback(
      async (
        messageId: string,
        feedback: number,
        onSuccess: () => void,
        feedbackComment?: string
      ) => {
        try {
          await toast.promise(
            ChainlitAPI.setHumanFeedback(
              messageId!,
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
