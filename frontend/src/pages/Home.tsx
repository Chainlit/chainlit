import Page from 'pages/Page';
import Chat from '@/components/chat';
import Geometry from '@/components/Geometry';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '@/components/ui/resizable';
import { useChatMessages } from '@chainlit/react-client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [currentVtpUrl, setCurrentVtpUrl] = useState<string>(
    '/files/by-key/user-uploads/2025/08/7ff1a7cc-9bf8-4c8d-8345-1ca7b5fd18d7.vtp'
  );
  const { messages } = useChatMessages();

  // Extract VTP file URLs from agent messages
  const extractVtpUrl = (content: string): string | null => {
    const vtpMatch = content.match(/\/files\/by-key\/[^.\s]+\.vtp/);
    return vtpMatch ? vtpMatch[0] : null;
  };

  // Update VTP URL when new agent messages arrive
  useEffect(() => {
    if (messages) {
      for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        const content = message.output || '';

        const vtpUrl = extractVtpUrl(content);
        if (vtpUrl) {
          console.log('Setting new VTP URL:', vtpUrl);
          setCurrentVtpUrl(vtpUrl);
          break;
        }
      }
    }
  }, [messages]);

  return (
    <Page>
      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        <ResizablePanel defaultSize={70}>
          <Geometry vtpUrl={currentVtpUrl} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30}>
          <Chat />
        </ResizablePanel>
      </ResizablePanelGroup>
    </Page>
  );
}
