import { ArrowDown } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface Props {
  onClick?: () => void;
}

export default function ScrollDownButton({ onClick }: Props) {
  return (
    <Button
      size="icon"
      variant="outline"
      className="z-1 absolute -top-4 mx-auto rounded-full -translate-y-full"
      onClick={onClick}
    >
      <ArrowDown className="!size-4" />
    </Button>
  );
}
