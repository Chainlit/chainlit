import { IImageElement } from 'state/element';

import ImageElement from '../image';
import { ListWithSize } from './utils';

interface Props {
  items: IImageElement[];
}

export default function InlinedImageList({ items }: Props) {
  return (
    <ListWithSize<IImageElement>
      elements={items}
      renderElement={ImageElement}
    />
  );
}
