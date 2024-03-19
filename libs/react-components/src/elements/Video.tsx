import { type IVideoElement } from 'client-types/';

const VideoElement = ({ element }: { element: IVideoElement }) => {
  if (!element.url) {
    return null;
  }

  const url = new URL(element.url);

  const renderIframe = (src: string) => {
    return <iframe className={`${element.display}-video`} width="100%" src={src} allowFullScreen></iframe>;
  };

  if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
    const videoId = url.hostname.includes('youtu.be') ? url.pathname.split('/')[1] : url.searchParams.get('v');
    const youtubeSrc = `https://www.youtube.com/embed/${videoId}?${element.start ? `start=${element.start}&` : ''}${element.autoplay ? 'autoplay=1' : ''}`;
    
    return renderIframe(youtubeSrc);
  }

  return (
    <video 
      className={`${element.display}-video`} 
      width="100%" 
      controls 
      src={element.start ? `${element.url}#t=${element.start}` : element.url}
    ></video>
  );
};

export { VideoElement };
