import { useHotkeys } from 'react-hotkeys-hook';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"



import { useAudio, useConfig } from '@chainlit/react-client';

import { Translator } from 'components/i18n';

import { Button } from '../../ui/button';
import { VoiceLines } from '../../icons/VoiceLines';
import { X } from 'lucide-react';
import { Loader } from '../../Loader';

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
            {audioConnection === 'on' ? (
              <X className='!size-5' />
            ) : null}
            {audioConnection === 'off' ? (
              <VoiceLines className='!size-5' />
            ) : null}
            {audioConnection === 'connecting' ? (
              <Loader className='!size-4' />
            ) : null}
          </Button>
          </TooltipTrigger>
          <TooltipContent>
    <p>
    <Translator
            path={
              audioConnection === 'on'
                ? 'components.organisms.chat.inputBox.speechButton.stop'
                : audioConnection === 'off'
                ? 'components.organisms.chat.inputBox.speechButton.start'
                : 'components.organisms.chat.inputBox.speechButton.loading'
            }
            suffix=" (P)"
          />    </p>
  </TooltipContent>
</Tooltip>
</TooltipProvider>
  );
};
export default VoiceButton;
