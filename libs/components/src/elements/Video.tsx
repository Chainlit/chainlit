import { IVideoElement } from '../types/element';

const VideoElement = ({ element }: { element: IVideoElement }) => {
  if (!element.url && !element.content) {
    return null;
  }

  return (
    <video
      className={`${element.display}-video`}
      width="100%"
      controls
      src={
        element.url ||
        URL.createObjectURL(new Blob([element.content!], { type: 'video/mp4' }))
      }
    ></video>
  );
};

export { VideoElement };
