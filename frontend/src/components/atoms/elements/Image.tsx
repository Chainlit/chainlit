import { useState } from 'react';
import Skeleton from '@mui/material/Skeleton';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Download from 'yet-another-react-lightbox/plugins/download';

import { type IImageElement, useConfig } from '@chainlit/react-client';

import { FrameElement } from './Frame';

interface Props {
  element: IImageElement;
}

const ImageElement = ({ element }: Props) => {
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { config } = useConfig();

  if (!element.url) {
    return null;
  }

  const enableLightbox = typedConfig?.features?.image_lightbox && element.display === 'inline';

  const handleImageClick = () => {
    if (enableLightbox) {
      setLightboxOpen(true);
    }
  };

  return (
    <FrameElement>
      {loading && <Skeleton variant="rectangular" width="100%" height={200} />}
      <img
        className={`${element.display}-image`}
        src={element.url}
        onLoad={() => setLoading(false)}
        onClick={handleImageClick}
        style={{
          objectFit: 'cover',
          maxWidth: '100%',
          margin: 'auto',
          height: 'auto',
          display: 'block',
          cursor: enableLightbox ? 'pointer' : 'default'
        }}
        alt={element.name}
        loading="lazy"
      />
      {enableLightbox && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={[{ src: element.url }]}
          carousel={{ finite: true }}
          render={{ buttonPrev: () => null, buttonNext: () => null }}
          plugins={[Zoom, Download]}
          zoom={{
            maxZoomPixelRatio: 5,
            zoomInMultiplier: 2,
          }}
          download={{
            download: ({ slide }) => {
              const link = document.createElement('a');
              link.href = slide.src;
              link.download = element.name || 'image';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            },
          }}
        />
      )}
    </FrameElement>
  );
};

export { ImageElement };
