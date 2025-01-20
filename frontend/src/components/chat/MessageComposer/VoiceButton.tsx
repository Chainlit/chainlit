import { X } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';

import { useAudio, useConfig } from '@chainlit/react-client';

import AudioPresence from '@/components/AudioPresence';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Translator } from 'components/i18n';

import { Loader } from '../../Loader';
import { VoiceLines } from '../../icons/VoiceLines';
import { Button } from '../../ui/button';

interface Props {
  disabled?: boolean;
}

const VoiceButton = ({ disabled }: Props) => {
  const { config } = useConfig();
  const { startConversation, endConversation, audioConnection } = useAudio();
  const isEnabled = !!config?.features.audio.enabled;

  useHotkeys(
    'p',
    () => {
      if (!isEnabled) return;
      if (audioConnection === 'on') return endConversation();
      return startConversation();
    },
    [isEnabled, audioConnection, startConversation, endConversation]
  );

  if (!isEnabled) return null;

  return (
    <div className="flex items-center gap-1">
      {audioConnection === 'on' ? (
        <AudioPresence
          type="client"
          height={18}
          width={36}
          barCount={4}
          barSpacing={2}
        />
      ) : null}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={disabled}
              variant="ghost"
              size="icon"
              className="hover:bg-muted"
              onClick={
                audioConnection === 'on'
                  ? endConversation
                  : audioConnection === 'off'
                  ? startConversation
                  : undefined
              }
            >
              {audioConnection === 'on' ? <X className="!size-5" /> : null}
              {audioConnection === 'off' ? (
                <VoiceLines className="!size-6" />
              ) : null}
              {audioConnection === 'connecting' ? (
                <Loader className="!size-5" />
              ) : null}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              <Translator
                path={
                  audioConnection === 'on'
                    ? 'chat.speech.stop'
                    : audioConnection === 'off'
                    ? 'chat.speech.start'
                    : 'chat.speech.connecting'
                }
                suffix=" (P)"
              />
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
export default VoiceButton;
