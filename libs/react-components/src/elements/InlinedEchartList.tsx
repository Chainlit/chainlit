// Added by Jay 22/1/2024
import Stack from '@mui/material/Stack';

import type { IEChartsElement } from 'client-types/';

import { EChartsElement } from './Echarts';

interface Props {
  items: IEChartsElement[];
}

const InlinedEchartList = ({ items }: Props) => (
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

export { InlinedEchartList };
