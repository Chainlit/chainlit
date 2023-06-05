import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import { IImageElement } from 'state/element';
import ImageElement from '../image';

interface Props {
  items: IImageElement[];
}

function sizeToUnit(image: IImageElement) {
  if (image.size === 'small') {
    return 1;
  } else if (image.size === 'medium') {
    return 2;
  } else if (image.size === 'large') {
    return 4;
  } else {
    return 2;
  }
}

export default function InlinedImageList({ items }: Props) {
  return (
    <ImageList
      sx={{
        margin: 0,
        // Promote the list into its own layer in Chrome. This costs memory, but helps keeping high FPS.
        transform: 'translateZ(0)',
        width: '100%',
        maxWidth: 600,
        maxHeight: 400
      }}
      variant="quilted"
      cols={4}
      gap={8}
    >
      {items.map((image, i) => {
        const cols = sizeToUnit(image);
        const rows = sizeToUnit(image);

        return (
          <ImageListItem key={i} cols={cols} rows={rows}>
            <ImageElement element={image} />
          </ImageListItem>
        );
      })}
    </ImageList>
  );
}
