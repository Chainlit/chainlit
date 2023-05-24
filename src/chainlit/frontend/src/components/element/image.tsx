import { IImageElement } from 'state/element';
import ImageFrame from './frame';

interface Props {
  element: IImageElement;
}

export default function ImageElement({ element }: Props) {
  const src = element.url || URL.createObjectURL(new Blob([element.content!]));
  const className = `${element.display}-image`;
  return (
    <ImageFrame>
      <img
        className={className}
        src={src}
        onClick={(e) => {
          if (element.display === 'inline') {
            const w = window.open('');
            const target = e.target as HTMLImageElement;
            w?.document.write(`<img src="${target.src}" />`);
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
