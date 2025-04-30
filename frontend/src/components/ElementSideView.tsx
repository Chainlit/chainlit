import { cn } from '@/lib/utils';
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

  const isCanvas = sideView?.title === 'canvas';

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
        <SheetContent
          className={cn('md:hidden flex flex-col', isCanvas && 'p-0')}
        >
          {!isCanvas ? (
            <SheetHeader>
              <SheetTitle id="side-view-title">{sideView.title}</SheetTitle>
            </SheetHeader>
          ) : null}
          <div
            id="side-view-content"
            className={cn(
              'overflow-y-auto flex-grow flex flex-grow flex-col',
              isCanvas ? 'p-0' : 'gap-4 mt-4'
            )}
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
        minSize={isCanvas ? 30 : 10}
        defaultSize={isCanvas ? 50 : 20}
        className={`md:flex flex-col flex-grow sm:hidden transform transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <aside className="relative flex-grow overflow-y-auto mr-4 mb-4">
          <Card className="overflow-y-auto h-full relative flex flex-col">
            <div
              id="side-view-title"
              className={cn(
                'text-lg font-semibold text-foreground px-6 py-4 flex items-center',
                isCanvas && 'absolute top-0 z-10 bg-transparent'
              )}
            >
              <Button
                className="-ml-2"
                onClick={() => setSideView(undefined)}
                size="icon"
                variant={isCanvas ? 'default' : 'ghost'}
              >
                <ArrowLeft />
              </Button>
              {isCanvas ? null : sideView.title}
            </div>
            <CardContent
              id="side-view-content"
              className={cn(
                'flex flex-col flex-grow',
                isCanvas ? 'p-0' : 'gap-4'
              )}
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
