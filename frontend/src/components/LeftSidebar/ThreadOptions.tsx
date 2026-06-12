
import { cn } from '@/lib/utils';
import { Ellipsis, Share2, Trash2 } from 'lucide-react';

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
  // Changement ici : on accepte l'événement pour stopper la propagation
  onDelete: (e: React.MouseEvent) => void;
  onRename: (e: React.MouseEvent) => void;
  onShare?: (e: React.MouseEvent) => void;
  className?: string;
}

export default function ThreadOptions({
  onDelete,
  onRename,
  onShare,
  className
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Changement : Utilisation d'un bouton réel pour l'accessibilité */}
        <button
          type="button"
          
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault(); // Indispensable pour ne pas activer le <Link> parent
          }}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon' }),
            'h-8 w-8 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-muted-foreground',
            className
          )}
        >
          <Ellipsis className="h-4 w-4" />
          <span className="sr-only">Options</span>
        </button>
      </DropdownMenuTrigger>
      
      {/* Note : Assurez-vous que DropdownMenuContent n'utilise pas cl_shadowRootElement */}
      <DropdownMenuContent className="w-40" align="end">
        <DropdownMenuItem
          id="rename-thread"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRename(e);
          }}
          className="cursor-pointer"
        >
          <Pencil className="mr-2 h-4 w-4" />
          <Translator path="threadHistory.thread.menu.rename" />
        </DropdownMenuItem>

        {onShare && (
          <DropdownMenuItem
            id="share-thread"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onShare(e);
            }}
            className="cursor-pointer"
          >
            <Share2 className="mr-2 h-4 w-4" />
            <Translator path="threadHistory.thread.menu.share" />
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          id="delete-thread"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(e);
          }}
          className="text-red-500 focus:text-red-500 cursor-pointer"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <Translator path="threadHistory.thread.menu.delete" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}