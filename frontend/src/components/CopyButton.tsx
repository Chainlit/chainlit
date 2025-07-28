import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@/components/i18n/Translator';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import { markdownToHtml } from './Markdown';

interface Props {
  content: unknown;
  className?: string;
  mime?: string;
  allowHtml?: boolean;
  latex?: boolean;
}

const CopyButton = ({
  content,
  className,
  allowHtml = false,
  latex = false
}: Props) => {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const copyToClipboard = async () => {
    try {
      let textToCopy: string;

      if (typeof content === 'object') {
        textToCopy = JSON.stringify(content, null, 2);
        await navigator.clipboard.writeText(textToCopy);
      } else {
        textToCopy = await markdownToHtml(String(content), {
          allowHtml,
          latex
        });
        const htmlBlob = new Blob([textToCopy], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({
          'text/plain': String(content),
          'text/html': htmlBlob
        });
        await navigator.clipboard.write([clipboardItem]);
      }
      setCopied(true);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      toast.error('Failed to copy: ' + String(err));
    }
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={copyToClipboard}
            variant="ghost"
            size="icon"
            className={`text-muted-foreground ${className}`}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
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
    </TooltipProvider>
  );
};

export default CopyButton;
