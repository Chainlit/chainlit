import { cn, hasMessage } from '@/lib/utils';
import { useContext, useEffect, useMemo, useState } from 'react';

import {
  ChainlitContext,
  FileSpec,
  useChatMessages,
  useChatSession,
  useConfig
} from '@chainlit/react-client';

import { Logo } from '@/components/Logo';
import Markdown from '@/components/Markdown';

import MessageComposer from './MessageComposer';
import Starters from './Starters';

interface Props {
  fileSpec: FileSpec;
  onFileUpload: (payload: File[]) => void;
  onFileUploadError: (error: string) => void;
  setAutoScroll: (autoScroll: boolean) => void;
}

export default function WelcomeScreen(props: Props) {
  const apiClient = useContext(ChainlitContext);
  const { config } = useConfig();
  const { chatProfile } = useChatSession();
  const { messages } = useChatMessages();
  const [isVisible, setIsVisible] = useState(false);

  const chatProfiles = config?.chatProfiles;

  const allowHtml = config?.features?.unsafe_allow_html;
  const latex = config?.features?.latex;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const logo = useMemo(() => {
    if (chatProfile && chatProfiles) {
      const currentChatProfile = chatProfiles.find(
        (cp) => cp.name === chatProfile
      );
      if (currentChatProfile?.icon) {
        return (
          <div className="flex flex-col gap-2 mb-2 items-center">
            <img
              className="h-16 w-16 rounded-full"
              src={
                currentChatProfile?.icon.startsWith('/public')
                  ? apiClient.buildEndpoint(currentChatProfile?.icon)
                  : currentChatProfile?.icon
              }
            />
            {currentChatProfile?.markdown_description ? (
              <Markdown allowHtml={allowHtml} latex={latex}>
                {currentChatProfile.markdown_description}
              </Markdown>
            ) : null}
          </div>
        );
      }
    }

    return <Logo className="w-[200px] mb-2" />;
  }, [chatProfiles, chatProfile]);

  if (hasMessage(messages)) return null;

  return (
    <div
      className={cn(
        'flex flex-col -mt-[60px] gap-4 w-full flex-grow items-center justify-center welcome-screen mx-auto transition-opacity duration-500 opacity-0 delay-100',
        isVisible && 'opacity-100'
      )}
    >
      {logo}
      <MessageComposer {...props} />
      <Starters />
    </div>
  );
}
