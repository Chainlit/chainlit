import ReactPlayer from 'react-player';

import { type IVideoElement } from 'client-types/';

const VideoElement = ({ element }: { element: IVideoElement }) => {
  if (!element.url) {
    return null;
  }

  return (
    <ReactPlayer
      className={`${element.display}-video`}
      width="100%"
      controls
      url={element.url}
      config={element.playerConfig || {}}
    />
  );
};

export { VideoElement };
