import type { ElementType, IMessageElement } from '@chainlit/react-client';

import { InlinedCustomElementList } from './InlineCustomElementList';
import { InlinedAudioList } from './InlinedAudioList';
import { InlinedDataframeList } from './InlinedDataframeList';
import { InlinedFileList } from './InlinedFileList';
import { InlinedImageList } from './InlinedImageList';
import { InlinedPDFList } from './InlinedPDFList';
import { InlinedPlotlyList } from './InlinedPlotlyList';
import { InlinedTextList } from './InlinedTextList';
import { InlinedVideoList } from './InlinedVideoList';

interface Props {
  elements: IMessageElement[];
}

const InlinedElements = ({ elements }: Props) => {
  if (!elements.length) {
    return null;
  }

  /**
   * Categorize the elements by element type
   * The TypeScript dance is needed to make sure we can do elementsByType.image
   * and get an array of IImageElement.
   */
  const elementsByType = elements.reduce(
    (acc, el: IMessageElement) => {
      if (!acc[el.type]) {
        acc[el.type] = [];
      }
      const array = acc[el.type] as Extract<
        IMessageElement,
        { type: typeof el.type }
      >[];
      array.push(el);
      return acc;
    },
    {} as {
      [K in ElementType]: Extract<IMessageElement, { type: K }>[];
    }
  );

  return (
    <div className="flex flex-col gap-4">
      {elementsByType.custom?.length ? (
        <InlinedCustomElementList items={elementsByType.custom} />
      ) : null}
      {elementsByType.image?.length ? (
        <InlinedImageList items={elementsByType.image} />
      ) : null}
      {elementsByType.text?.length ? (
        <InlinedTextList items={elementsByType.text} />
      ) : null}
      {elementsByType.pdf?.length ? (
        <InlinedPDFList items={elementsByType.pdf} />
      ) : null}
      {elementsByType.audio?.length ? (
        <InlinedAudioList items={elementsByType.audio} />
      ) : null}
      {elementsByType.video?.length ? (
        <InlinedVideoList items={elementsByType.video} />
      ) : null}
      {elementsByType.file?.length ? (
        <InlinedFileList items={elementsByType.file} />
      ) : null}
      {elementsByType.plotly?.length ? (
        <InlinedPlotlyList items={elementsByType.plotly} />
      ) : null}
      {elementsByType.dataframe?.length ? (
        <InlinedDataframeList items={elementsByType.dataframe} />
      ) : null}
    </div>
  );
};

export { InlinedElements };
