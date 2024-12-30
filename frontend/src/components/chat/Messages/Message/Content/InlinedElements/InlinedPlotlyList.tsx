import type { IPlotlyElement } from '@chainlit/react-client';

import { PlotlyElement } from '@/components/Elements/Plotly';

interface Props {
  items: IPlotlyElement[];
}

const InlinedPlotlyList = ({ items }: Props) => (
  <div className="flex flex-col gap-2">
    {items.map((element, i) => {
      return (
        <div
          key={i}
          className="max-w-[600px] h-[400px]"
          style={{
            maxWidth: '600px',
            height: '400px'
          }}
        >
          <PlotlyElement element={element} />
        </div>
      );
    })}
  </div>
);

export { InlinedPlotlyList };
