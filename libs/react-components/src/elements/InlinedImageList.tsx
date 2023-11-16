import type { IImageElement } from 'client-types/';

import { ImageElement } from './Image';
import { ListWithSize } from './ListWithSize';

interface Props {
  items: IImageElement[];
}

const InlinedImageList = ({ items }: Props) => (
  <ListWithSize<IImageElement> elements={items} renderElement={ImageElement} />
);

export { InlinedImageList };
