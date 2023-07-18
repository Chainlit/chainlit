import { IImageElement } from 'state/element';

import ImageFrame from './frame';

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

export default function ImageElement({ element }: Props) {
  const src = element.url || URL.createObjectURL(new Blob([element.content!]));
  const className = `${element.display}-image`;
  return (
    <ImageFrame>
      <img
        className={className}
        src={src}
        onClick={() => {
          if (element.display === 'inline') {
            const name = `${element.name}.png`;
            handleImageClick(name, src);
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
    </ImageFrame>
  );
}
