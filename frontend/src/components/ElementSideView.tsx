import { X } from 'lucide-react';
import { useRecoilState } from 'recoil';

import { sideViewState } from '@chainlit/react-client';

import { ResizableHandle, ResizablePanel } from '@/components/ui/resizable';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';

import { useIsMobile } from '@/hooks/use-mobile';

import { Element } from './Elements';

export default function ElementSideView() {
  const [sideViewElement, setSideViewElement] = useRecoilState(sideViewState);
  const isMobile = useIsMobile();

  if (!sideViewElement) return null;

  if (isMobile) {
    return (
      <Sheet
        open
        onOpenChange={(open) => !open && setSideViewElement(undefined)}
      >
        <SheetContent className="md:hidden flex flex-col">
          <SheetHeader>
            <SheetTitle id="side-view-title">{sideViewElement.name}</SheetTitle>
          </SheetHeader>
          <div
            id="side-view-content"
            className="mt-4 overflow-y-auto flex-grow"
          >
            <Element element={sideViewElement} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <ResizableHandle className="sm:hidden md:block" />
      <ResizablePanel
        minSize={10}
        defaultSize={20}
        className="md:flex p-6 bg-sidebar relative flex-col flex-grow gap-4 sm:hidden"
      >
        <div
          onClick={() => setSideViewElement(undefined)}
          className="absolute cursor-pointer right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </div>
        <div
          id="side-view-title"
          className="text-lg font-semibold text-foreground"
        >
          {sideViewElement.name}
        </div>
        <div
          id="side-view-content"
          className="flex flex-col flex-grow overflow-y-auto"
        >
          <Element element={sideViewElement} />
        </div>
      </ResizablePanel>
    </>
  );
}
