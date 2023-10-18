import React from 'react';

import { useChat } from '@chainlit/components';

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
  const { callAction, messages, actions, elements, askUser, avatars, loading } =
    useChat();

  return !messages.length && projectSettings?.ui.show_readme_as_default ? (
    <WelcomeScreen markdown={projectSettings?.markdown} />
  ) : (
    <MessageContainer
      avatars={avatars}
      loading={loading}
      askUser={askUser}
      actions={actions}
      elements={elements}
      messages={messages}
      autoScroll={autoScroll}
      callAction={callAction}
      setAutoScroll={setAutoScroll}
    />
  );
};

export default Messages;
