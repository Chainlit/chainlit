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
  sideViewState,
  useChatInteract,
  useConfig
} from '@chainlit/react-client';

import { MessageContainer as CMessageContainer } from 'components/molecules/messages/MessageContainer';

import { highlightMessage } from 'state/project';

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
        allowHtml: config?.features?.unsafe_allow_html,
        latex: config?.features?.latex,
        defaultCollapseContent: !!config?.ui.default_collapse_content,
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
