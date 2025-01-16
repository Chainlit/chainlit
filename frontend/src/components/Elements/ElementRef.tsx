import { MessageContext } from '@/contexts/MessageContext';
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
      className="cursor-pointer uppercase -translate-y-px inline-flex items-center rounded-xl bg-muted px-1.5 text-[0.7rem] font-medium text-muted-foreground element-link hover:bg-primary hover:text-primary-foreground h-[22px]"
      onClick={() => onElementRefClick?.(element)}
    >
      {element.name}
    </a>
  );
};

export { ElementRef };
