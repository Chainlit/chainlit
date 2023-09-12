import { ChainlitAPI } from 'api/chainlitApi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import {
  MessageContainer as CMessageContainer,
  IAction,
  IMessage,
  IMessageElement
} from '@chainlit/components';

import {
  askUserState,
  highlightMessage,
  loadingState,
  sessionState
} from 'state/chat';
import { avatarState, sideViewState } from 'state/element';
import { playgroundState } from 'state/playground';
import { projectSettingsState } from 'state/project';
import { settingsState } from 'state/settings';
import { accessTokenState } from 'state/user';

interface Props {
  actions: IAction[];
  elements: IMessageElement[];
  messages: IMessage[];
  autoScroll?: boolean;
  setAutoScroll?: (autoScroll: boolean) => void;
}

const MessageContainer = ({
  actions,
  autoScroll,
  elements,
  messages,
  setAutoScroll
}: Props) => {
  const accessToken = useRecoilValue(accessTokenState);
  const appSettings = useRecoilValue(settingsState);
  const askUser = useRecoilValue(askUserState);
  const avatars = useRecoilValue(avatarState);
  const highlightedMessage = useRecoilValue(highlightMessage);
  const loading = useRecoilValue(loadingState);
  const projectSettings = useRecoilValue(projectSettingsState);
  const session = useRecoilValue(sessionState);
  const setPlayground = useSetRecoilState(playgroundState);
  const setSideView = useSetRecoilState(sideViewState);

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
    value: number,
    onSuccess: () => void
  ) => {
    try {
      await toast.promise(
        ChainlitAPI.setHumanFeedback(messageId!, value, accessToken),
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
        globalMessage.humanFeedback = value;
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
        const sessionId = session?.socket.id;

        if (!sessionId) {
          return;
        }
        session?.socket.emit('action_call', action);
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
        askUser,
        avatars,
        defaultCollapseContent: appSettings.defaultCollapseContent,
        expandAll: appSettings.expandAll,
        hideCot: appSettings.hideCot,
        highlightedMessage,
        loading,
        showFeedbackButtons: enableFeedback,
        uiName: projectSettings?.ui?.name || '',
        onPlaygroundButtonClick,
        onFeedbackUpdated,
        onElementRefClick
      }}
    />
  );
};

export default MessageContainer;
