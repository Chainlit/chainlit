import { Element } from '@chainlit/app/src/components/Elements';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@chainlit/app/src/components/ui/dialog';
import { useChatStore } from '@chainlit/react-client';

export default function ElementSideView() {
  const sideView = useChatStore((state) => state.sideView);
  const setSideView = useChatStore((state) => state.setSideView);

  if (!sideView || sideView.title === 'canvas') return null;

  return (
    <Dialog open onOpenChange={(open) => !open && setSideView(undefined)}>
      <DialogContent className="max-w-[80%]">
        <DialogHeader>
          <DialogTitle>{sideView.title}</DialogTitle>
        </DialogHeader>
        <div
          className="mt-4 overflow-y-auto overscroll-contain min-h-[50vh] max-h-[80vh] flex flex-col gap-4"
          onWheel={(e) => e.stopPropagation()}
        >
          {sideView.elements.map((e) => (
            <Element key={e.id} element={e} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
