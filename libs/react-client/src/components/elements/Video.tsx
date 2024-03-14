import { type IVideoElement } from 'src/types';

const VideoElement = ({ element }: { element: IVideoElement }) => {
  if (!element.url) {
    return null;
  }

  return (
    <video
      className={`${element.display}-video`}
      width="100%"
      controls
      src={element.url}
    ></video>
  );
};

export { VideoElement };
