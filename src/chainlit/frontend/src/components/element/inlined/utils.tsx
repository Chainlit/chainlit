import { ImageList, ImageListItem } from '@mui/material';

import { IImageElement, IVideoElement } from 'state/element';

export function sizeToUnit(element: IImageElement | IVideoElement) {
  if (element.size === 'small') {
    return 1;
  } else if (element.size === 'medium') {
    return 2;
  } else if (element.size === 'large') {
    return 4;
  } else {
    return 2;
  }
}

export function ListWithSize<T extends IImageElement | IVideoElement>({
  elements,
  renderElement: Renderer
}: {
  elements: T[];
  renderElement: ({ element }: { element: T }) => JSX.Element | null;
}) {
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
      {elements.map((element, i) => {
        const cols = sizeToUnit(element);
        const rows = sizeToUnit(element);

        return (
          <ImageListItem key={i} cols={cols} rows={rows}>
            <Renderer element={element} />
          </ImageListItem>
        );
      })}
    </ImageList>
  );
}
