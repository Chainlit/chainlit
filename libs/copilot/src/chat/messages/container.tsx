import { memo, useCallback, useMemo } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import { MessageContainer as CMessageContainer } from '@chainlit/app/src/components/molecules/messages/MessageContainer';
import { highlightMessage } from '@chainlit/app/src/state/project';
import {
  IAction,
  IAsk,
  IFeedback,
  IMessageElement,
  IStep,
  useChatInteract,
  useConfig
} from '@chainlit/react-client';
import { sideViewState } from '@chainlit/react-client';

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
    feedbackId: string
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
    const { config } = useConfig();
    const setSideView = useSetRecoilState(sideViewState);
    const highlightedMessage = useRecoilValue(highlightMessage);
    const { uploadFile: _uploadFile } = useChatInteract();

    const uploadFile = useCallback(
      (file: File, onProgress: (progress: number) => void) => {
        return _uploadFile(file, onProgress);
      },
      [_uploadFile]
    );

    const enableFeedback = !!config?.dataPersistence;

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
        allowHtml: config?.features?.unsafe_allow_html,
        latex: config?.features?.latex,
        defaultCollapseContent: true,
        highlightedMessage,
        loading,
        showFeedbackButtons: enableFeedback,
        uiName: config?.ui?.name || '',
        onElementRefClick,
        onError,
        onFeedbackUpdated,
        onFeedbackDeleted
      };
    }, [
      askUser,
      enableFeedback,
      highlightedMessage,
      loading,
      config?.ui?.name,
      config?.features?.unsafe_allow_html,
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
