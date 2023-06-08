import { IPdfElement } from 'state/element';

interface Props {
  element: IPdfElement;
}

export default function PDFElement({ element }: Props) {
  if (!element.url && !element.content) {
    return null;
  }
  const className = `${element.display}-pdf`;
  const src =
    element.url ||
    URL.createObjectURL(
      new Blob([element.content!], { type: 'application/pdf' })
    );
  return (
    <iframe
      className={className}
      src={src}
      style={{ border: 'none' }}
      width="100%"
      height="100%"
    ></iframe>
  );
}
