import { useState } from 'react';

import Skeleton from '@mui/material/Skeleton';

import { type IImageElement } from 'client-types/';

import { FrameElement } from './Frame';

interface Props {
  element: IImageElement;
}

const handleImageClick = (name: string, src: string) => {
  const link = document.createElement('a');
  link.href = src;
  link.target = '_blank';
  link.download = name;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const ImageElement = ({ element }: Props) => {
  const [loading, setLoading] = useState(true);

  if (!element.url) {
    return null;
  }

  return (
    <FrameElement>
      {loading && <Skeleton variant="rectangular" width="100%" height={200} />}
      <img
        className={`${element.display}-image`}
        src={element.url}
        onLoad={() => setLoading(false)}
        onClick={() => {
          if (element.display === 'inline') {
            const name = `${element.name}.png`;
            handleImageClick(name, element.url!);
          }
        }}
        style={{
          objectFit: 'cover',
          maxWidth: '100%',
          margin: 'auto',
          height: 'auto',
          display: 'block',
          cursor: element.display === 'inline' ? 'pointer' : 'default'
        }}
        alt={element.name}
        loading="lazy"
      />
    </FrameElement>
  );
};

export { ImageElement };
