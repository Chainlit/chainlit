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
  const [sideView, setSideView] = useRecoilState(sideViewState);

  if (!sideView) return null;

  return (
    <Sheet open onOpenChange={(open) => !open && setSideView(undefined)}>
      <SheetContent side="left" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{sideView.title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 overflow-y-auto flex-grow flex flex-col gap-4">
          {sideView.elements.map((e) => (
            <Element key={e.id} element={e} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
