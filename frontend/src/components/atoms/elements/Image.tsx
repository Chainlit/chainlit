import { Suspense, lazy, useState } from 'react';

import Skeleton from '@mui/material/Skeleton';

import { type IImageElement, useConfig } from '@chainlit/react-client';

import { FrameElement } from './Frame';

// Lazy load the Lightbox component and its dependencies
const LightboxWrapper = lazy(() => import('./LightboxWrapper'));

interface Props {
  element: IImageElement;
}

const ImageElement = ({ element }: Props) => {
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const config = useConfig();

  if (!element.url) {
    return null;
  }

  const enableLightbox =
    config.config?.features.image_lightbox && element.display === 'inline';

  const handleImageClick = () => {
    if (enableLightbox) {
      setLightboxOpen(true);
    } else {
      // Fall back to popup window behavior
      const width = window.innerWidth / 2;
      const height = window.innerHeight / 2;
      const left = window.innerWidth / 4;
      const top = window.innerHeight / 4;

      const newWindow = window.open(
        '',
        '_blank',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>${element.name}</title>
              <link rel="icon" href="/favicon">
              <style>
                body {
                  margin: 0;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  background-color: rgba(0, 0, 0, 0.8);
                }
                img {
                  max-width: 100%;
                  max-height: calc(100% - 50px);
                }
                a {
                  margin: 10px 0;
                  color: white;
                  text-decoration: none;
                  font-size: 15px;
                  background-color: rgba(255, 255, 255, 0.2);
                  padding: 8px 12px;
                  border-radius: 5px;
                }
                a:hover {
                  background-color: rgba(255, 255, 255, 0.4);
                }
              </style>
            </head>
            <body>
              <img src="${element.url}" alt="${element.name}" />
              <a href="${element.url}" download="${element.name}">Download</a>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
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
      {enableLightbox && lightboxOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <LightboxWrapper
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            imageUrl={element.url}
            imageName={element.name}
          />
        </Suspense>
      )}
    </FrameElement>
  );
};

export { ImageElement };
