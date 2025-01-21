import { X } from 'lucide-react';
import { useRecoilState } from 'recoil';
import { useState, useEffect } from 'react';
import { sideViewState } from '@chainlit/react-client';

import { ResizableHandle, ResizablePanel } from '@/components/ui/resizable';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';

import { useIsMobile } from '@/hooks/use-mobile';

import { Element } from './Elements';

export default function ElementSideView() {
  const [sideView, setSideView] = useRecoilState(sideViewState);
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (sideView) {
      // Delay setting visibility to trigger animation
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
    }
  }, [sideView]);

  if (!sideView) return null;

  if (isMobile) {
    return (
      <Sheet
        open
        onOpenChange={(open) => !open && setSideView(undefined)}
      >
        <SheetContent className="md:hidden flex flex-col">
          <SheetHeader>
            <SheetTitle id="side-view-title">{sideView.title}</SheetTitle>
          </SheetHeader>
          <div
            id="side-view-content"
            className="mt-4 overflow-y-auto flex-grow"
          >
                   {sideView.elements.map((e) => (
          <Element key={e.id} element={e} />
          ))}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <ResizableHandle className="sm:hidden md:block bg-transparent" />
      <ResizablePanel
        minSize={10}
        defaultSize={20}
        className={`md:flex flex-col flex-grow sm:hidden transform transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <aside className="relative flex-grow overflow-y-auto mr-4 mb-4">
          <Card className="overflow-y-auto h-full">
            <div
              onClick={() => setSideView(undefined)}
              className="absolute cursor-pointer right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </div>
            <div
              id="side-view-title"
              className="text-lg font-semibold text-foreground px-6 pt-4"
            >
              {sideView.title}
            </div>
            <CardContent id="side-view-content" className="flex flex-col gap-2">
            {sideView.elements.map((e) => (
          <Element key={e.id} element={e} />
          ))}
            </CardContent>
          </Card>
        </aside>
      </ResizablePanel>
    </>
  );
}