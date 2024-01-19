import { WidgetContext } from 'context';
import { useCallback, useContext } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import WelcomeScreen from '@chainlit/app/src/components/organisms/chat/Messages/welcomeScreen';
import {
  IProjectSettings,
  projectSettingsState
} from '@chainlit/app/src/state/project';
import {
  IAction,
  IFeedback,
  IStep,
  messagesState,
  updateMessageById,
  useChatData,
  useChatInteract,
  useChatMessages,
  useChatSession
} from '@chainlit/react-client';

import MessageContainer from './container';

interface MessagesProps {
  autoScroll: boolean;
  projectSettings?: IProjectSettings;
  setAutoScroll: (autoScroll: boolean) => void;
}

const Messages = ({
  autoScroll,
  setAutoScroll
}: MessagesProps): JSX.Element => {
  const projectSettings = useRecoilValue(projectSettingsState);
  const { apiClient, accessToken } = useContext(WidgetContext);
  const { idToResume } = useChatSession();

  const { elements, askUser, avatars, loading, actions } = useChatData();
  const { messages } = useChatMessages();
  const { callAction } = useChatInteract();
  const setMessages = useSetRecoilState(messagesState);

  const callActionWithToast = useCallback(
    (action: IAction) => {
      const promise = callAction(action);
      if (promise) {
        toast.promise(promise, {
          loading: `Running ${action.name}`,
          success: (res) => {
            if (res.response) {
              return res.response;
            } else {
              return `${action.name} executed successfully`;
            }
          },
          error: (res) => {
            if (res.response) {
              return res.response;
            } else {
              return `${action.name} failed`;
            }
          }
        });
      }
    },
    [callAction]
  );

  const onFeedbackUpdated = useCallback(
    async (message: IStep, onSuccess: () => void, feedback: IFeedback) => {
      try {
        toast.promise(apiClient.setFeedback(feedback, accessToken), {
          loading: 'Updating',
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
            return 'Feedback updated!';
          },
          error: (err) => {
            return <span>{err.message}</span>;
          }
        });
      } catch (err) {
        console.log(err);
      }
    },
    []
  );

  const showWelcomeScreen =
    !idToResume &&
    !messages.length &&
    projectSettings?.ui.show_readme_as_default;

  if (showWelcomeScreen) {
    return (
      <WelcomeScreen
        variant="copilot"
        markdown={projectSettings?.markdown}
        allowHtml={projectSettings?.features?.unsafe_allow_html}
        latex={projectSettings?.features?.latex}
      />
    );
  }

  return (
    <MessageContainer
      avatars={avatars}
      loading={loading}
      askUser={askUser}
      actions={actions}
      elements={elements}
      messages={messages}
      autoScroll={autoScroll}
      onFeedbackUpdated={onFeedbackUpdated}
      callAction={callActionWithToast}
      setAutoScroll={setAutoScroll}
    />
  );
};

export default Messages;
