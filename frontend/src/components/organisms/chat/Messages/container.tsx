import { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import {
  IAction,
  IAsk,
  IFeedback,
  IMessageElement,
  IStep,
  useChatInteract
} from '@chainlit/react-client';
import { sideViewState } from '@chainlit/react-client';

import { MessageContainer as CMessageContainer } from 'components/molecules/messages/MessageContainer';

import { apiClientState } from 'state/apiClient';
import { highlightMessage } from 'state/project';
import { projectSettingsState } from 'state/project';
import { settingsState } from 'state/settings';

interface Props {
  loading: boolean;
  actions: IAction[];
  elements: IMessageElement[];
  messages: IStep[];
  askUser?: IAsk;
  onFeedbackUpdated: (
    message: IStep,
    onSuccess: () => void,
    feedback: IFeedback
  ) => void;
  onFeedbackDeleted: (
    message: IStep,
    onSuccess: () => void,
    feedback: string
  ) => void;
  callAction?: (action: IAction) => void;
}

const MessageContainer = memo(
  ({
    askUser,
    loading,
    actions,
    elements,
    messages,
    onFeedbackUpdated,
    onFeedbackDeleted,
    callAction
  }: Props) => {
    const appSettings = useRecoilValue(settingsState);
    const projectSettings = useRecoilValue(projectSettingsState);
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
        defaultCollapseContent: appSettings.defaultCollapseContent,
        highlightedMessage,
        loading,
        showFeedbackButtons: enableFeedback,
        uiName: projectSettings?.ui?.name || '',
        onElementRefClick,
        onError,
        onFeedbackUpdated,
        onFeedbackDeleted
      };
    }, [
      appSettings.defaultCollapseContent,
      askUser,
      enableFeedback,
      highlightedMessage,
      loading,
      projectSettings?.ui?.name,
      projectSettings?.features?.unsafe_allow_html,
      onElementRefClick,
      onError,
      onFeedbackUpdated
    ]);

    return (
      <CMessageContainer
        actions={messageActions}
        elements={elements}
        messages={messages}
        context={memoizedContext}
      />
    );
  }
);

export default MessageContainer;
