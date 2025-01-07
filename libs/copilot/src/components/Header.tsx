import { Maximize, Minimize } from 'lucide-react';

import AudioPresence from '@chainlit/app/src/components/AudioPresence';
import { Logo } from '@chainlit/app/src/components/Logo';
import ChatProfiles from '@chainlit/app/src/components/header/ChatProfiles';
import NewChatButton from '@chainlit/app/src/components/header/NewChat';
import { Button } from '@chainlit/app/src/components/ui/button';
import { useAudio, useConfig } from '@chainlit/react-client';

interface Props {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}

const Header = ({ expanded, setExpanded }: Props): JSX.Element => {
  const { config } = useConfig();
  const { audioConnection } = useAudio();

  const hasChatProfiles = !!config?.chatProfiles.length;

  return (
    <div className="flex align-center justify-between p-4 pb-0">
      <div className="flex items-center gap-1">
        {hasChatProfiles ? <ChatProfiles /> : <Logo className="w-[100px]" />}
      </div>
      <div className="flex items-center">
        {audioConnection === 'on' ? (
          <AudioPresence
            type="server"
            height={20}
            width={40}
            barCount={4}
            barSpacing={2}
          />
        ) : null}
        <NewChatButton className="text-muted-foreground mt-[1.5px]" />
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <Minimize className="!size-5 text-muted-foreground" />
          ) : (
            <Maximize className="!size-5 text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default Header;
