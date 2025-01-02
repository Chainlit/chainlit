import type { IMessageElement } from '@chainlit/react-client';

import { AudioElement } from './Audio';
import CustomElement from './CustomElement';
import { FileElement } from './File';
import { ImageElement } from './Image';
import { LazyDataframe } from './LazyDataframe';
import { PDFElement } from './PDF';
import { PlotlyElement } from './Plotly';
import { TextElement } from './Text';
import { VideoElement } from './Video';

interface ElementProps {
  element?: IMessageElement;
}

const Element = ({ element }: ElementProps): JSX.Element | null => {
  switch (element?.type) {
    case 'file':
      return <FileElement element={element} />;
    case 'image':
      return <ImageElement element={element} />;
    case 'text':
      return <TextElement element={element} />;
    case 'pdf':
      return <PDFElement element={element} />;
    case 'audio':
      return <AudioElement element={element} />;
    case 'video':
      return <VideoElement element={element} />;
    case 'plotly':
      return <PlotlyElement element={element} />;
    case 'dataframe':
      return <LazyDataframe element={element} />;
    case 'custom':
      return <CustomElement element={element} />;
    default:
      return null;
  }
};

export { Element };
