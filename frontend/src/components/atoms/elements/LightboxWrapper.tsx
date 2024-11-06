import Lightbox from 'yet-another-react-lightbox';
import Download from 'yet-another-react-lightbox/plugins/download';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

import 'yet-another-react-lightbox/styles.css';

interface LightboxWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName: string;
}

const LightboxWrapper = ({
  isOpen,
  onClose,
  imageUrl,
  imageName
}: LightboxWrapperProps) => {
  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      slides={[{ src: imageUrl }]}
      carousel={{ finite: true }}
      render={{ buttonPrev: () => null, buttonNext: () => null }}
      plugins={[Zoom, Download]}
      zoom={{
        maxZoomPixelRatio: 5,
        zoomInMultiplier: 2
      }}
      download={{
        download: async ({ slide }) => {
          try {
            const response = await fetch(slide.src, { mode: 'cors' });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = imageName || 'image';
            link.click();
            window.URL.revokeObjectURL(url);
          } catch (error) {
            console.error('Failed to download image:', error);
          }
        }
      }}
    />
  );
};

export default LightboxWrapper;
