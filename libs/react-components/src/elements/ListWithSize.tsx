import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';

import type { IImageElement, IVideoElement } from 'client-types/';

const sizeToUnit = (element: IImageElement | IVideoElement) => {
  switch (element.size) {
    case 'small':
      return 1;
    case 'medium':
      return 2;
    case 'large':
      return 4;
    default:
      return 2;
  }
};

const ListWithSize = <T extends IImageElement | IVideoElement>({
  elements,
  renderElement: Renderer
}: {
  elements: T[];
  renderElement: ({ element }: { element: T }) => JSX.Element | null;
}) => {
  return (
    <ImageList
      sx={{
        margin: 0,
        // Promote the list into its own layer in Chrome. This costs memory, but helps keeping high FPS.
        transform: 'translateZ(0)',
        width: '100%',
        maxWidth: 600
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
};

export { ListWithSize };
