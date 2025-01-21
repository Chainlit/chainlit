import { useConfig } from '@chainlit/react-client';

import Markdown from '@/components/Markdown';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Translator } from 'components/i18n';

import { useLayoutMaxWidth } from 'hooks/useLayoutMaxWidth';

export default function ReadmeButton() {
  const { config } = useConfig();
  const layoutMaxWidth = useLayoutMaxWidth();

  if (!config?.markdown) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button id="readme-button" variant="ghost">
          <Translator path="navigation.header.readme" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col h-screen w-screen max-w-screen max-h-screen border-none !rounded-none overflow-y-auto">
        <div
          className="mx-auto flex flex-col flex-grow gap-6"
          style={{
            maxWidth: layoutMaxWidth
          }}
        >
          <DialogHeader>
            <DialogTitle>
              <Translator path="navigation.header.readme" />
            </DialogTitle>
          </DialogHeader>
          <Markdown
            className="flex flex-col flex-grow overflow-y-auto"
            allowHtml={config?.features?.unsafe_allow_html}
            latex={config?.features?.latex}
          >
            {config.markdown}
          </Markdown>
        </div>
      </DialogContent>
    </Dialog>
  );
}
