import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';

import { Link } from '@mui/material';

import { IMessageElement } from 'src/types/element';

interface Props {
  element: IMessageElement;
}

const ElementRef = ({ element }: Props) => {
  const { onElementRefClick } = useContext(MessageContext);

  if (element.display === 'inline') {
    return <span style={{ fontWeight: 700 }}>{element.name}</span>;
  }

  return (
    <Link
      role="link"
      className="element-link"
      onClick={() => onElementRefClick && onElementRefClick(element)}
    >
      {element.name}
    </Link>
  );
};

export { ElementRef };
