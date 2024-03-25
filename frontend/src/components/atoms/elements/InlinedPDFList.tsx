import Stack from '@mui/material/Stack';

import type { IPdfElement } from 'client-types/';

import { PDFElement } from './PDF';

interface Props {
  items: IPdfElement[];
}

const InlinedPDFList = ({ items }: Props) => (
  <Stack spacing={1}>
    {items.map((pdf, i) => {
      return (
        <div
          key={i}
          style={{
            maxWidth: '600px',
            height: '400px'
          }}
        >
          <PDFElement element={pdf} />
        </div>
      );
    })}
  </Stack>
);

export { InlinedPDFList };
