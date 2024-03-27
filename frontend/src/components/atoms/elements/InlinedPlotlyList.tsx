import Stack from '@mui/material/Stack';

import type { IPlotlyElement } from 'client-types/';

import { PlotlyElement } from './Plotly';

interface Props {
  items: IPlotlyElement[];
}

const InlinedPlotlyList = ({ items }: Props) => (
  <Stack spacing={1}>
    {items.map((element, i) => {
      return (
        <div
          key={i}
          style={{
            maxWidth: '600px',
            height: '400px'
          }}
        >
          <PlotlyElement element={element} />
        </div>
      );
    })}
  </Stack>
);

export { InlinedPlotlyList };
