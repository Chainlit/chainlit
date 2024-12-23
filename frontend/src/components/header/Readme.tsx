import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useConfig } from '@chainlit/react-client';
import { Translator } from 'components/i18n';
import Markdown from '@/components/Markdown';

export default function ReadmeButton() {
  const { config } = useConfig()

  if (!config?.markdown) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          id="readme-button"
          variant="ghost" 
        >
          <Translator path="components.organisms.header.readme" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-10 h-screen w-screen max-w-screen max-h-screen border-none !rounded-none">
        <DialogHeader>
          <DialogTitle>
            <Translator path="components.organisms.header.readme" />
          </DialogTitle>
        </DialogHeader>
        <Markdown className='flex flex-col flex-grow overflow-y-auto' allowHtml={config?.features?.unsafe_allow_html} latex={config?.features?.latex}>
            {config.markdown}
          </Markdown>
      </DialogContent>
    </Dialog>
  );
}