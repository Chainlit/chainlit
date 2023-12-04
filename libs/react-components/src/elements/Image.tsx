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
  if (!element.url) {
    return null;
  }

  return (
    <FrameElement>
      <img
        className={`${element.display}-image`}
        src={element.url}
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
