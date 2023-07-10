import { Stack } from '@mui/material';

import PDFElement from 'components/element/pdf';

import { IPdfElement } from 'state/element';

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
