import type { IImageElement } from 'client-types/';

import { QuiltedGrid } from '@/components/QuiltedGrid';
import { ImageElement } from '@/components/Elements/Image';

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
