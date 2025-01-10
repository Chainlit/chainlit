import { MessageContext } from '@/contexts/MessageContext';
import { cn } from '@/lib/utils';
import { useContext } from 'react';

import type { IMessageElement } from '@chainlit/react-client';

interface ElementRefProps {
  element: IMessageElement;
}

const ElementRef = ({ element }: ElementRefProps) => {
  const { onElementRefClick } = useContext(MessageContext);

  // For inline elements, return a styled span
  if (element.display === 'inline') {
    return <span className="font-bold">{element.name}</span>;
  }

  // For other elements, return a clickable link
  return (
    <a
      href="#"
      className={cn('cursor-pointer hover:underline text-primary element-link')}
      onClick={() => onElementRefClick?.(element)}
    >
      {element.name}
    </a>
  );
};

export { ElementRef };
