import { Box } from '@mui/material';
import { IElement } from 'state/element';

interface Props {
  element: IElement;
}

export default function ImageElement({ element }: Props) {
  const src = element.url || URL.createObjectURL(new Blob([element.content!]));
  return (
    <Box
      sx={{
        p: 1,
        boxSizing: 'border-box',
        bgcolor: (theme) =>
          theme.palette.mode === 'light' ? '#EEEEEE' : '#212121',
        borderRadius: '4px'
      }}
    >
      <img
        src={src}
        style={{ objectFit: 'cover', width: '100%' }}
        alt={element.name}
      />
    </Box>
  );
}
