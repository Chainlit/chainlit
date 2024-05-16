import type { IImageElement } from 'client-types/';
import { memo, useMemo } from 'react';

import { ImageElement } from './Image';
import { ListWithSize } from './ListWithSize';

interface Props {
  items: IImageElement[];
}

const InlinedImageList = memo(({ items }: Props) => (
  <ListWithSize<IImageElement>
    elements={items}
    renderElement={(ctx) => <ImageElement element={ctx.element} />}
  />
), (prevProps, nextProps) => {
  const propsEqual = prevProps.items.filter(item => nextProps.items.some(nitem => nitem.url === item.url)).length === prevProps.items.length;
  return propsEqual;
});

// const InlinedImageList = ({ items }: Props) => {
//   const list = useMemo(() => {
//     return (
//       <ListWithSize<IImageElement>
//         elements={items}
//         renderElement={(ctx) => <ImageElement element={ctx.element} />}
//       />
//     );
//   }, []);
//   return list;
// };

export { InlinedImageList };
