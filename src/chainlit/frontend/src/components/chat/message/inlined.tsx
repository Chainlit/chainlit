import { ElementType, IElements, AllElements } from 'state/element';
import InlinedImageList from 'components/element/inlined/images';
import { Stack } from '@mui/material';
import InlinedTextList from 'components/element/inlined/texts';
import { IAction } from 'state/action';
import InlinedActionList from 'components/action/inlined';
import InlinedPDFList from 'components/element/inlined/pdfs';
import InlinedAudioList from 'components/element/inlined/audios';

interface Props {
  elements: IElements;
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
    (acc, el: AllElements) => {
      if (!acc[el.type]) {
        acc[el.type] = [];
      }
      const array = acc[el.type] as Extract<
        AllElements,
        { type: typeof el.type }
      >[];
      array.push(el);
      return acc;
    },
    {} as {
      [K in ElementType]: Extract<AllElements, { type: K }>[];
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
      {actions.length ? <InlinedActionList actions={actions} /> : null}
    </Stack>
  );
}
