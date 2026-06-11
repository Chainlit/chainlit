import { ImageElement } from '@/components/Elements/Image';
import { QuiltedGrid } from '@/components/QuiltedGrid';

import type { IImageElement } from '@chainlit/react-client';

interface Props {
  items: IImageElement[];
}

const InlinedImageList = ({ items }: Props) => (
  <QuiltedGrid
    elements={items}
    renderElement={(ctx) => <ImageElement element={ctx.element} />}
  />
);

export { InlinedImageList };
