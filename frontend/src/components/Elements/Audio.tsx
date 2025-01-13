import { cn } from '@/lib/utils';

import { IAudioElement } from '@chainlit/react-client';

const AudioElement = ({ element }: { element: IAudioElement }) => {
  if (!element.url) {
    return null;
  }

  return (
    <div className={cn('space-y-2', `${element.display}-audio`)}>
      <p className="text-sm leading-7 text-muted-foreground">{element.name}</p>
      <audio controls src={element.url} autoPlay={element.autoPlay} />
    </div>
  );
};

export { AudioElement };
