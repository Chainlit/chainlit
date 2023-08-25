import { IVideoElement } from 'types/element';

interface Props {
  element: IVideoElement;
}

export default function VideoElement({ element }: Props) {
  if (!element.url && !element.content) {
    return null;
  }
  const className = `${element.display}-video`;
  const src =
    element.url ||
    URL.createObjectURL(new Blob([element.content!], { type: 'video/mp4' }));
  return <video className={className} width="100%" controls src={src}></video>;
}
