import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';

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
        margin: 0,
        width: '100%',
        maxWidth: '600px',
        height: 200,
        // Promote the list into its own layer in Chrome. This costs memory, but helps keeping high FPS.
        transform: 'translateZ(0)'
      }}
      rowHeight={200}
      gap={5}
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
                width: 'auto',
                p: 1,
                boxSizing: 'border-box',
                bgcolor: (theme) =>
                  theme.palette.mode === 'light' ? '#EEEEEE' : '#212121',
                borderRadius: '4px'
              }
            }}
          >
            <img
              className="inlined-image"
              src={item.src}
              alt={item.title}
              loading="lazy"
            />
            {/* <ImageListItemBar title={item.title} position="top" /> */}
          </ImageListItem>
        );
      })}
    </ImageList>
  );
}
