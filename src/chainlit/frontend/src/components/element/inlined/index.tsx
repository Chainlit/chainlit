import { ElementType, IElements } from 'state/element';
import InlinedImageList from './image';
import { Stack } from '@mui/material';
import InlinedTextList from './text';
import { IAction } from 'state/action';
import InlinedActionList from './action';

interface Props {
  elements: IElements;
  actions: IAction[];
}

export default function InlinedElements({ elements, actions }: Props) {
  if (!elements.length && !actions.length) {
    return null;
  }

  const images = elements
    .filter((el) => el.type === ElementType.img)
    .map((el) => {
      return {
        url: el.url,
        src: el.url || URL.createObjectURL(new Blob([el.content!])),
        title: el.name
      };
    });

  const texts = elements.filter((el) => el.type === ElementType.txt);

  return (
    <Stack gap={1} mt={1}>
      {images.length ? <InlinedImageList items={images} /> : null}
      {Object.keys(texts).length ? <InlinedTextList items={texts} /> : null}
      {actions.length ? <InlinedActionList actions={actions} /> : null}
    </Stack>
  );
}
