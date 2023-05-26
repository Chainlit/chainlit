import {
  ElementType,
  IElements,
  IImageElement,
  ITextElement
} from 'state/element';
import InlinedImageList from 'components/element/inlined/image';
import { Stack } from '@mui/material';
import InlinedTextList from 'components/element/inlined/text';
import { IAction } from 'state/action';
import InlinedActionList from 'components/action/inlined';

interface Props {
  elements: IElements;
  actions: IAction[];
}

export default function InlinedElements({ elements, actions }: Props) {
  if (!elements.length && !actions.length) {
    return null;
  }

  const images = elements.filter(
    (el) => el.type === ElementType.img
  ) as IImageElement[];

  const texts = elements.filter(
    (el) => el.type === ElementType.txt
  ) as ITextElement[];

  return (
    <Stack gap={1} mt={1}>
      {images.length ? <InlinedImageList images={images} /> : null}
      {Object.keys(texts).length ? <InlinedTextList items={texts} /> : null}
      {actions.length ? <InlinedActionList actions={actions} /> : null}
    </Stack>
  );
}
