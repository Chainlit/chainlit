import { IImageElement } from '../types/element';

import { ImageElement } from './Image';
import { ListWithSize } from './ListWithSize';

interface Props {
  items: IImageElement[];
}

const InlinedImageList = ({ items }: Props) => {
  return (
    <ListWithSize<IImageElement>
      elements={items}
      renderElement={ImageElement}
    />
  );
};

export { InlinedImageList };
