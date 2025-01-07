import { useRecoilState } from 'recoil';

import { Element } from '@chainlit/app/src/components/Elements';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@chainlit/app/src/components/ui/sheet';
import { sideViewState } from '@chainlit/react-client';

export default function ElementSideView() {
  const [sideViewElement, setSideViewElement] = useRecoilState(sideViewState);

  if (!sideViewElement) return null;

  return (
    <Sheet open onOpenChange={(open) => !open && setSideViewElement(undefined)}>
      <SheetContent side="left" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{sideViewElement.name}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 overflow-y-auto flex-grow">
          <Element element={sideViewElement} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
