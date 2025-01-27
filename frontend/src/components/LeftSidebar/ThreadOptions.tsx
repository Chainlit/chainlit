import { cn } from '@/lib/utils';
import { Ellipsis, Trash } from 'lucide-react';

import { Pencil } from '@/components/icons/Pencil';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { Translator } from '../i18n';

interface Props {
  onDelete: () => void;
  onRename: () => void;
  className?: string;
}

export default function ThreadOptions({
  onDelete,
  onRename,
  className
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          id="thread-options"
          className={cn(
            'focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-muted-foreground',
            className
          )}
        >
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-20" align="start" forceMount>
        <DropdownMenuItem
          id="rename-thread"
          onClick={(e) => {
            e.stopPropagation();
            onRename();
          }}
        >
          <Translator path="threadHistory.thread.menu.rename" />
          <Pencil className="ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuItem
          id="delete-thread"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-red-500 focus:text-red-500"
        >
          <Translator path="threadHistory.thread.menu.delete" />
          <Trash className="ml-auto" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
