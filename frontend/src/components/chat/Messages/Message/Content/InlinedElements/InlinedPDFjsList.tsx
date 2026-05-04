import type { IPdfjsElement } from '@chainlit/react-client';

import { PDFjsElement } from '@/components/Elements/PDFjs';

interface Props {
  items: IPdfjsElement[];
}

const InlinedPDFjsList = ({ items }: Props) => (
  <div className="flex flex-col gap-2">
    {items.map((pdf) => {
      return (
        <div key={pdf.id}>
          <PDFjsElement element={pdf} />
        </div>
      );
    })}
  </div>
);

export { InlinedPDFjsList };
