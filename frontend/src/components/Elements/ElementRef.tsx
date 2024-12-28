import { MessageContext } from "@/contexts/MessageContext";
import { cn } from "@/lib/utils";
import type { IMessageElement } from '@chainlit/react-client';
import { useContext } from "react";



interface ElementRefProps {
  element: IMessageElement;
}

const ElementRef = ({ element }: ElementRefProps) => {
  const { onElementRefClick } = useContext(MessageContext);

  // For inline elements, return a styled span
  if (element.display === "inline") {
    return <span className="font-bold">{element.name}</span>;
  }

  // For other elements, return a clickable link
  return (
    <a
      className={cn("cursor-pointer hover:underline text-primary")}
      onClick={() => onElementRefClick?.(element)}
    >
      {element.name}
    </a>
  );
};

export { ElementRef };