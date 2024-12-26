import type { IVideoElement } from 'client-types/';

import { QuiltedGrid } from '@/components/QuiltedGrid';
import { VideoElement } from '@/components/Elements/Video';

interface Props {
  items: IVideoElement[];
}

const InlinedVideoList = ({ items }: Props) => (
    <QuiltedGrid 
    elements={items}
    renderElement={(ctx) => <VideoElement element={ctx.element} />}
  />

);

export { InlinedVideoList };
