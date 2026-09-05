import { Mic, Square } from 'lucide-react';

import { useTranslation } from '@/components/i18n/Translator';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

export default function DictationButton({
  disabled,
  supported,
  listening,
  onClick
}: {
  disabled: boolean;
  supported: boolean;
  listening: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const label = t(
    !supported
      ? 'chat.speech.unsupported'
      : listening
        ? 'chat.speech.stop'
        : 'chat.speech.dictate'
  );
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              type="button"
              disabled={disabled || !supported}
              variant="ghost"
              size="icon"
              aria-label={label}
              aria-pressed={listening}
              onClick={onClick}
            >
              {listening ? (
                <Square className="!size-5" />
              ) : (
                <Mic className="!size-5" />
              )}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
