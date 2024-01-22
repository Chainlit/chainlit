import { WidgetContext } from 'context';
import { memo, useCallback, useContext, useMemo } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import {
  highlightMessage,
  sideViewState
} from '@chainlit/app/src/state/project';
import { projectSettingsState } from '@chainlit/app/src/state/project';
import { settingsState } from '@chainlit/app/src/state/settings';
import {
  IAction,
  IAsk,
  IAvatarElement,
  IFeedback,
  IMessageElement,
  IStep,
  useChatInteract
} from '@chainlit/react-client';
import { MessageContainer as CMessageContainer } from '@chainlit/react-components';

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
    const { apiClient } = useContext(WidgetContext);
    const projectSettings = useRecoilValue(projectSettingsState);
    const { hideCot } = useRecoilValue(settingsState);
    const setSideView = useSetRecoilState(sideViewState);
    const highlightedMessage = useRecoilValue(highlightMessage);
    const { uploadFile: _uploadFile } = useChatInteract();

    const uploadFile = useCallback(
      (file: File, onProgress: (progress: number) => void) => {
        return _uploadFile(apiClient, file, onProgress);
      },
      [_uploadFile]
    );

    const enableFeedback = !!projectSettings?.dataPersistence;

    const onPlaygroundButtonClick = useCallback(() => null, []);

    const onElementRefClick = useCallback(
      (element: IMessageElement) => {
        if (element.display === 'side') {
          setSideView(element);
          return;
        }
      },
      [setSideView]
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
        defaultCollapseContent: true,
        expandAll: false,
        hideCot: hideCot,
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
