import { IStarterCategory } from '@chainlit/react-client';

import { Button } from '@/components/ui/button';

interface Props {
  category: IStarterCategory;
  isSelected: boolean;
  onClick: () => void;
}

export default function StarterCategory({ category, isSelected, onClick }: Props) {
  return (
    <Button
      variant={isSelected ? 'default' : 'outline'}
      className="rounded-full gap-2"
      onClick={onClick}
    >
      {category.icon && (
        <img className="h-4 w-4" src={category.icon} alt="" />
      )}
      {category.label}
    </Button>
  );
}
