import { IVideoElement } from 'state/element';

import VideoElement from '../video';
import { ListWithSize } from './utils';

interface Props {
  items: IVideoElement[];
}

export default function InlinedVideoList({ items }: Props) {
  return (
    <ListWithSize<IVideoElement>
      elements={items}
      renderElement={VideoElement}
    />
  );
}
