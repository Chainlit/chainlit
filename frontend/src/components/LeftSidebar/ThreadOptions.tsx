import { cn } from '@/lib/utils';
import { Ellipsis, Trash2 } from 'lucide-react';

import { Pencil } from '@/components/icons/Pencil';
import { buttonVariants } from '@/components/ui/button';
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
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          id="thread-options"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon' }),
            'focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-muted-foreground',
            className
          )}
        >
          <Ellipsis />
        </div>
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
          <Trash2 className="ml-auto" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
