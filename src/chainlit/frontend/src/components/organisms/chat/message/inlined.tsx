import { Stack } from '@mui/material';

import InlinedActionList from 'components/atoms/action/inlined';
import InlinedAudioList from 'components/atoms/element/inlined/audios';
import InlinedFileList from 'components/atoms/element/inlined/files';
import InlinedImageList from 'components/atoms/element/inlined/images';
import InlinedPDFList from 'components/atoms/element/inlined/pdfs';
import InlinedTextList from 'components/atoms/element/inlined/texts';
import InlinedVideoList from 'components/atoms/element/inlined/videos';

import { IAction } from 'state/action';
import { ElementType, IMessageElement } from 'state/element';

interface Props {
  elements: IMessageElement[];
  actions: IAction[];
}

export default function InlinedElements({ elements, actions }: Props) {
  if (!elements.length && !actions.length) {
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
    <Stack gap={1} mt={1}>
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
      {actions.length ? <InlinedActionList actions={actions} /> : null}
    </Stack>
  );
}
