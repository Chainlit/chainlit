import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';

import { sideViewState } from '@chainlit/react-client';

import { Card, CardContent } from '@/components/ui/card';
import { ResizableHandle, ResizablePanel } from '@/components/ui/resizable';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';

import { useIsMobile } from '@/hooks/use-mobile';

import { Element } from './Elements';
import { Button } from './ui/button';

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
      <Sheet open onOpenChange={(open) => !open && setSideView(undefined)}>
        <SheetContent className="md:hidden flex flex-col">
          <SheetHeader>
            <SheetTitle id="side-view-title">{sideView.title}</SheetTitle>
          </SheetHeader>
          <div
            id="side-view-content"
            className="mt-4 overflow-y-auto flex-grow flex flex-grow flex-col gap-4"
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
          <Card className="overflow-y-auto h-full flex flex-col">
            <div
              id="side-view-title"
              className="text-lg font-semibold text-foreground px-6 py-4 flex items-center"
            >
              <Button
                className="-ml-2"
                onClick={() => setSideView(undefined)}
                size="icon"
                variant="ghost"
              >
                <ArrowLeft />
              </Button>
              {sideView.title}
            </div>
            <CardContent
              id="side-view-content"
              className="flex flex-col flex-grow gap-4"
            >
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
