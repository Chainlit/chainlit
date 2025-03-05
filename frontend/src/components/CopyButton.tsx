import { Check, Copy, ArrowDownToLine  } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@/components/i18n/Translator';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface Props {
  content: string;
  className?: string;
}

const CopyButton = ({ content, className }: Props) => {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  // Function to extract the image URL from the content
  const extractImageUrl = (text: string): string | null => {
    const regex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/;
    const match = text.match(regex);
    if (match) {
      const url = match[1];
      return url.includes('?type=image') ? url : null;
    }
    return null;
  };

  // Memoized image URL extraction
  const imageUrl = useMemo(() => extractImageUrl(content), [content]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy: ' + String(err));
    }
  };

  const handleDownload = () => {
    if (!imageUrl) {
      toast.error('No file URL found');
      return;
    }
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = 'downloaded-image';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={copyToClipboard}
              variant="ghost"
              size="icon"
              className={`text-muted-foreground ${className}`}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {copied
                ? t('chat.messages.actions.copy.success')
                : t('chat.messages.actions.copy.button')}
            </p>
          </TooltipContent>
        </Tooltip>

        {imageUrl && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleDownload}
                variant="ghost"
                size="icon"
                className={`text-muted-foreground ${className}`}
              >
                <ArrowDownToLine  className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('chat.messages.actions.download.button')}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

export default CopyButton;
