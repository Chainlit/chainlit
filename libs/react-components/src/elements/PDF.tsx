import { type IPdfElement } from 'client-types/';

interface Props {
  element: IPdfElement;
}

const PDFElement = ({ element }: Props) => {
  if (!element.url) {
    return null;
  }

  return (
    <iframe
      className={`${element.display}-pdf`}
      src={element.url}
      style={{ border: 'none' }}
      width="100%"
      height="100%"
    ></iframe>
  );
};

export { PDFElement };
