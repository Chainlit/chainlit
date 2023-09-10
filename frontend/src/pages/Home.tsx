import Page from 'pages/Page';

import Chat from 'components/organisms/chat/index';
import ChatSettingsModal from 'components/organisms/chat/settings';
import PromptPlayground from 'components/organisms/playground';

export default function Home() {
  return (
    <Page>
      <>
        <PromptPlayground />
        <ChatSettingsModal />
        <Chat />
      </>
    </Page>
  );
}
