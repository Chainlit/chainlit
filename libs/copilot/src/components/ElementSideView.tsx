import { useRecoilState } from 'recoil';

import { Element } from '@chainlit/app/src/components/Elements';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@chainlit/app/src/components/ui/dialog';
import { sideViewState } from '@chainlit/react-client';

export default function ElementSideView() {
  const [sideView, setSideView] = useRecoilState(sideViewState);

  if (!sideView || sideView.title === 'canvas') return null;

  return (
    <Dialog open onOpenChange={(open) => !open && setSideView(undefined)}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle>{sideView.title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 overflow-y-auto min-h-[50vh] max-h-[80vh] flex flex-col gap-4">
          {sideView.elements.map((e) => (
            <Element key={e.id} element={e} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
