import { IVideoElement } from '../types/element';

import { ListWithSize } from './ListWithSize';
import { VideoElement } from './Video';

interface Props {
  items: IVideoElement[];
}

const InlinedVideoList = ({ items }: Props) => {
  return (
    <ListWithSize<IVideoElement>
      elements={items}
      renderElement={VideoElement}
    />
  );
};

export { InlinedVideoList };
