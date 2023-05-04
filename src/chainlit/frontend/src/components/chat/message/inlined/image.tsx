import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';

interface Props {
  items: {
    src: string;
    title: string;
  }[];
}

export default function InlinedImageList({ items }: Props) {
  return (
    <ImageList
      sx={{
        width: '100%',
        height: 200,
        // Promote the list into its own layer in Chrome. This costs memory, but helps keeping high FPS.
        transform: 'translateZ(0)'
      }}
      rowHeight={200}
      gap={1}
    >
      {items.map((item) => {
        const cols = 1;
        const rows = 1;

        return (
          <ImageListItem
            key={item.src}
            cols={cols}
            rows={rows}
            sx={{
              '.MuiImageListItem-img': {
                height: '100%',
                width: 'auto'
              }
            }}
          >
            <img src={item.src} alt={item.title} loading="lazy" />
            <ImageListItemBar
              sx={{
                background:
                  'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, ' +
                  'rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)'
              }}
              title={item.title}
              position="top"
            />
          </ImageListItem>
        );
      })}
    </ImageList>
  );
}
