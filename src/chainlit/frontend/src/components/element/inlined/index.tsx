import { ElementType, IElements } from 'state/element';
import InlinedImageList from './image';
import { Stack } from '@mui/material';
import InlinedTextList from './text';

interface Props {
  inlined: IElements;
}

export default function InlinedElements({ inlined }: Props) {
  if (!inlined || !Object.keys(inlined).length) {
    return null;
  }

  const images = Object.keys(inlined)
    .filter((key) => inlined[key].type === ElementType.img)
    .map((k) => {
      return {
        url: inlined[k].url,
        src:
          inlined[k].url ||
          URL.createObjectURL(new Blob([inlined[k].content!])),
        title: inlined[k].name
      };
    });

  const texts = Object.fromEntries(
    Object.entries(inlined).filter(([k, v]) => v.type === ElementType.txt)
  );

  return (
    <Stack gap={1} mt={1}>
      {images.length ? <InlinedImageList items={images} /> : null}
      {Object.keys(texts).length ? <InlinedTextList items={texts} /> : null}
    </Stack>
  );
}
