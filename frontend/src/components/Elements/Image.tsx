import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useState } from 'react';

import { IImageElement } from '@chainlit/react-client';

import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal
} from '@/components/ui/dialog';

const ImageElement = ({ element }: { element: IImageElement }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!element.url) return null;

  const handleClick = () => {
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="rounded-sm bg-muted overflow-hidden">
        <img
          className={cn(
            'mx-auto block max-w-full h-auto',
            element.display === 'inline' && 'cursor-pointer',
            `${element.display}-image`
          )}
          src={element.url}
          alt={element.name}
          loading="lazy"
          onClick={handleClick}
        />
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-black/80" />
          <DialogContent className="border-none bg-transparent shadow-none max-w-none p-0 max-h-screen overflow-auto [&>button]:hidden">
            <div className="relative w-full h-full flex items-center justify-center">
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Close lightbox"
              >
                <X className="h-6 w-6" />
              </button>

              <img
                src={element.url}
                alt={element.name}
                className="max-w-[90vw] max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
};

export { ImageElement };
