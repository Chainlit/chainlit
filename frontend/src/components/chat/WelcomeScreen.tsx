import { cn, hasMessage } from '@/lib/utils';
import {
  MutableRefObject,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useRecoilValue } from 'recoil';

import {
  ChainlitContext,
  FileSpec,
  useChatMessages,
  useChatSession,
  useConfig
} from '@chainlit/react-client';

// import { Logo } from '@/components/Logo';
import { Markdown } from '@/components/Markdown';

import { chatModeState, webSearchState } from '@/state/chat';

import MessageComposer from './MessageComposer';
import PromptBlock from './PromptBlock';
import Starters from './Starters';

interface PromptSection {
  header: string;
  questions: string[];
}

interface Props {
  fileSpec: FileSpec;
  onFileUpload: (payload: File[]) => void;
  onFileUploadError: (error: string) => void;
  autoScrollRef: MutableRefObject<boolean>;
}

export default function WelcomeScreen(props: Props) {
  const apiClient = useContext(ChainlitContext);
  const { config } = useConfig();
  const { chatProfile } = useChatSession();
  const { messages } = useChatMessages();
  const [isVisible, setIsVisible] = useState(false);
  const [promptSections, setPromptSections] = useState<PromptSection[]>([]);

  const mode = useRecoilValue(chatModeState);
  const web = useRecoilValue(webSearchState);

  const chatProfiles = config?.chatProfiles;

  const allowHtml = config?.features?.unsafe_allow_html;
  const latex = config?.features?.latex;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await apiClient.post('/get_examples', {
          mode,
          web
        });
        const data = await response.json();
        setPromptSections(data);
      } catch (error) {
        console.error('Failed to fetch prompts:', error);
        setPromptSections([]);
      }
    };

    fetchPrompts();
  }, [mode, web, apiClient]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useMemo(() => {
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

    //return <Logo className="w-[200px] mb-2" />;
  }, [chatProfiles, chatProfile]);

  if (hasMessage(messages)) return null;

  // {logo} - потом вставить
  return (
    <div
      id="welcome-screen"
      className={cn(
        'flex flex-col -mt-[60px] gap-4 w-full flex-grow items-center justify-center welcome-screen mx-auto transition-opacity duration-500 opacity-0 delay-100',
        isVisible && 'opacity-100'
      )}
    >
      <div className="prompt-block hidden md:block mb-10"></div>
      <div className="prompt-block hidden md:block mb-10"></div>
      <div className="prompt-block hidden md:block mb-10"></div>
      <div className="prompt-block hidden md:block mb-10"></div>
      <div className="prompt-block hidden md:block mb-10"></div>
      <div className="prompt-block hidden md:block mb-10"></div>
      <MessageComposer {...props} />
      <Starters />

      <div className="mt-4 flex w-full flex-col items-center gap-4 hidden md:block">
        {promptSections.map((section) => (
          <PromptBlock
            key={section.header}
            header={section.header}
            questions={section.questions}
          />
        ))}
      </div>
    </div>
  );
}
