import { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import {
  IAction,
  IAsk,
  IAvatarElement,
  IFeedback,
  IFunction,
  IMessageElement,
  IStep,
  ITool,
  useChatInteract
} from '@chainlit/react-client';
import { MessageContainer as CMessageContainer } from '@chainlit/react-components';

import { apiClientState } from 'state/apiClient';
import { playgroundState } from 'state/playground';
import { highlightMessage, sideViewState } from 'state/project';
import { projectSettingsState } from 'state/project';
import { settingsState } from 'state/settings';

interface Props {
  loading: boolean;
  actions: IAction[];
  elements: IMessageElement[];
  avatars: IAvatarElement[];
  messages: IStep[];
  askUser?: IAsk;
  autoScroll?: boolean;
  onFeedbackUpdated: (
    message: IStep,
    onSuccess: () => void,
    feedback: IFeedback
  ) => void;
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
    onFeedbackUpdated,
    callAction,
    setAutoScroll
  }: Props) => {
    const appSettings = useRecoilValue(settingsState);
    const projectSettings = useRecoilValue(projectSettingsState);
    const setPlayground = useSetRecoilState(playgroundState);
    const setSideView = useSetRecoilState(sideViewState);
    const highlightedMessage = useRecoilValue(highlightMessage);
    const { uploadFile: _uploadFile } = useChatInteract();
    const apiClient = useRecoilValue(apiClientState);

    const uploadFile = useCallback(
      (file: File, onProgress: (progress: number) => void) => {
        return _uploadFile(apiClient, file, onProgress);
      },
      [_uploadFile]
    );

    const enableFeedback = !!projectSettings?.dataPersistence;

    const navigate = useNavigate();

    const onPlaygroundButtonClick = useCallback(
      (message: IStep) => {
        setPlayground((old) => {
          const generation = message.generation;
          let functions =
            (generation?.settings?.functions as unknown as IFunction[]) || [];
          const tools =
            (generation?.settings?.tools as unknown as ITool[]) || [];
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
            generation: generation
              ? {
                  ...generation,
                  functions
                }
              : undefined,
            originalGeneration: generation
              ? {
                  ...generation,
                  functions
                }
              : undefined
          };
        });
      },
      [setPlayground]
    );

    const onElementRefClick = useCallback(
      (element: IMessageElement) => {
        let path = `/element/${element.id}`;

        if (element.display === 'side') {
          setSideView(element);
          return;
        }

        if (element.threadId) {
          path += `?thread=${element.threadId}`;
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
        uploadFile,
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
