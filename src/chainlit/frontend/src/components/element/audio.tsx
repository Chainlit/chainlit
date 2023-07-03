import { IAudioElement } from 'state/element';

interface Props {
  element: IAudioElement;
}

export default function AudioElement({ element }: Props) {
  if (!element.url && !element.content) {
    return null;
  }
  const className = `${element.display}-audio`;
  const src = element.url || URL.createObjectURL(new Blob([element.content!]));
  return <audio controls src={src} className={className}></audio>;
}
