import Stack from '@mui/material/Stack';

import type { IEChartsElement } from 'client-types/';

import { EChartsElement } from './ECharts';

interface Props {
  items: IEChartsElement[];
}

const InlinedEChartsList = ({ items }: Props) => (
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
          <EChartsElement element={element} />
        </div>
      );
    })}
  </Stack>
);

export { InlinedEChartsList };
