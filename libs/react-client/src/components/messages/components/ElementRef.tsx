import { useContext } from 'react';
import { MessageContext } from 'src/contexts/MessageContext';
import type { IMessageElement } from 'src/types';

import Link from '@mui/material/Link';

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
      sx={{ cursor: 'pointer' }}
      onClick={() => onElementRefClick && onElementRefClick(element)}
    >
      {element.name}
    </Link>
  );
};

export { ElementRef };
