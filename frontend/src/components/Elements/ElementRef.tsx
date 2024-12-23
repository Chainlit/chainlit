import { cn } from "@/lib/utils";
import type { IMessageElement } from '@chainlit/react-client';



interface ElementRefProps {
  element: IMessageElement;
  onElementRefClick?: (element: IMessageElement) => void;
}

const ElementRef = ({ element, onElementRefClick }: ElementRefProps) => {
  // For inline elements, return a styled span
  if (element.display === "inline") {
    return <span className="font-bold">{element.name}</span>;
  }

  // For other elements, return a clickable link
  return (
    <a
      className={cn("cursor-pointer hover:underline")}
      onClick={() => onElementRefClick?.(element)}
    >
      {element.name}
    </a>
  );
};

export { ElementRef };