import type { IDataframeElement } from '@chainlit/react-client';

import { LazyDataframe } from '@/components/Elements/LazyDataframe';

interface Props {
  items: IDataframeElement[];
}

const InlinedDataframeList = ({ items }: Props) => (
  <div className="flex gap-1">
    {items.map((element, i) => {
      return (
        <div key={i} className="w-full">
          <LazyDataframe element={element} />
        </div>
      );
    })}
  </div>
);

export { InlinedDataframeList };
