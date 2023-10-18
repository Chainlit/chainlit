import { ChainlitAPI } from 'api/chainlitApi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import {
  MessageContainer as CMessageContainer,
  IAction,
  IAsk,
  IAvatarElement,
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

const MessageContainer = ({
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

  const onPlaygroundButtonClick = (message: IMessage) => {
    setPlayground((old) => ({
      ...old,
      prompt: message.prompt,
      originalPrompt: message.prompt
    }));
  };

  const onFeedbackUpdated = async (
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

      const globalMessage = messages.find((m) => m.id === messageId);
      if (globalMessage) {
        globalMessage.humanFeedback = feedback;
        globalMessage.humanFeedbackComment = feedbackComment;
      }
      onSuccess();
    } catch (err) {
      console.log(err);
    }
  };

  const onElementRefClick = (element: IMessageElement) => {
    let path = `/element/${element.id}`;

    if (element.display === 'side') {
      setSideView(element);
      return;
    }

    if (element.conversationId) {
      path += `?conversation=${element.conversationId}`;
    }

    navigate(element.display === 'page' ? path : '#');
  };

  const messageActions = actions.map((action) => ({
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
  }));

  return (
    <CMessageContainer
      actions={messageActions}
      elements={elements}
      messages={messages}
      autoScroll={autoScroll}
      setAutoScroll={setAutoScroll}
      context={{
        highlightedMessage,
        askUser,
        avatars,
        defaultCollapseContent: appSettings.defaultCollapseContent,
        expandAll: appSettings.expandAll,
        hideCot: appSettings.hideCot,
        loading,
        showFeedbackButtons: enableFeedback,
        uiName: projectSettings?.ui?.name || '',
        onPlaygroundButtonClick,
        onFeedbackUpdated,
        onElementRefClick,
        onError: (error) => toast.error(error)
      }}
    />
  );
};

export default MessageContainer;
