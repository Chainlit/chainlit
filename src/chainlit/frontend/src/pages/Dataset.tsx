import CloudProvider from 'components/cloudProvider';
import Conversation from 'components/dataset';
import Page from 'pages/Page';

export default function Dataset() {
  return (
    <Page>
      <CloudProvider>
        <Conversation />
      </CloudProvider>
    </Page>
  );
}
