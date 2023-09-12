import { IPdfElement } from 'src/types/element';

interface Props {
  element: IPdfElement;
}

const PDFElement = ({ element }: Props) => {
  if (!element.url && !element.content) {
    return null;
  }

  return (
    <iframe
      className={`${element.display}-pdf`}
      src={
        element.url ||
        URL.createObjectURL(
          new Blob([element.content!], { type: 'application/pdf' })
        )
      }
      style={{ border: 'none' }}
      width="100%"
      height="100%"
    ></iframe>
  );
};

export { PDFElement };
