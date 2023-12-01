import { useCallback } from 'react';
import { toast } from 'sonner';

import {
  IAction,
  useChatData,
  useChatInteract,
  useChatMessages,
  useChatSession
} from '@chainlit/react-client';

import { IProjectSettings } from 'state/project';

import MessageContainer from './container';
import WelcomeScreen from './welcomeScreen';

interface MessagesProps {
  autoScroll: boolean;
  projectSettings?: IProjectSettings;
  setAutoScroll: (autoScroll: boolean) => void;
}

const Messages = ({
  autoScroll,
  projectSettings,
  setAutoScroll
}: MessagesProps): JSX.Element => {
  const { elements, askUser, avatars, loading, actions } = useChatData();
  const { messages } = useChatMessages();
  const { callAction } = useChatInteract();
  const { idToResume } = useChatSession();

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

  return !idToResume &&
    !messages.length &&
    projectSettings?.ui.show_readme_as_default ? (
    <WelcomeScreen
      markdown={projectSettings?.markdown}
      allowHtml={projectSettings?.features?.unsafe_allow_html}
      latex={projectSettings?.features?.latex}
    />
  ) : (
    <MessageContainer
      avatars={avatars}
      loading={loading}
      askUser={askUser}
      actions={actions}
      elements={elements}
      messages={messages}
      autoScroll={autoScroll}
      callAction={callActionWithToast}
      setAutoScroll={setAutoScroll}
    />
  );
};

export default Messages;
