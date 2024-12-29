import { cn } from '@/lib/utils';

import { IImageElement, IVideoElement } from '@chainlit/react-client';

const sizeToUnit = (element: IImageElement | IVideoElement) => {
  switch (element.size) {
    case 'small':
      return 1;
    case 'medium':
      return 2;
    case 'large':
      return 4;
    default:
      return 2;
  }
};

interface QuiltedGridProps<T extends IImageElement | IVideoElement> {
  elements: T[];
  renderElement: ({ element }: { element: T }) => JSX.Element | null;
  className?: string;
}

const QuiltedGrid = <T extends IImageElement | IVideoElement>({
  elements,
  renderElement: Renderer,
  className
}: QuiltedGridProps<T>) => {
  return (
    <div
      className={cn(
        'grid grid-cols-4 gap-2 w-full max-w-[600px]',
        'transform-gpu', // equivalent to transform: translateZ(0)
        className
      )}
    >
      {elements.map((element, i) => {
        const cols = sizeToUnit(element);
        const rows = sizeToUnit(element);

        return (
          <div
            key={i}
            className={cn(
              'relative',
              cols === 1
                ? 'col-span-1'
                : cols === 2
                ? 'col-span-2'
                : 'col-span-4',
              rows === 1
                ? 'row-span-1'
                : rows === 2
                ? 'row-span-2'
                : 'row-span-4'
            )}
          >
            <Renderer element={element} />
          </div>
        );
      })}
    </div>
  );
};

export { QuiltedGrid };
