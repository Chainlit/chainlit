import { Stack } from '@mui/material';

import { IPdfElement } from 'state/element';

import PDFElement from '../pdf';

interface Props {
  items: IPdfElement[];
}

export default function InlinedPDFList({ items }: Props) {
  return (
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
}
