import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@radix-ui/react-popover';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { useRecoilValue } from 'recoil';

import { favoriteMessagesState, useConfig } from '@chainlit/react-client';

import { useTranslation } from '@/components/i18n/Translator';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandListScrollable
} from '@/components/ui/command';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface Props {
  disabled?: boolean;
  onSelect: (content: string) => void;
}

export const FavoriteButton = ({ disabled = false, onSelect }: Props) => {
  const favorites = useRecoilValue(favoriteMessagesState);
  const { config } = useConfig();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (!config?.features?.favorites) return null;
  if (!favorites.length) return null;

  return (
    <div className={cn('favorite-popover-wrapper')}>
      <Popover open={open} onOpenChange={setOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'flex items-center h-9 px-3 rounded-full font-medium text-[13px] gap-1.5',
                    'hover:bg-muted hover:dark:bg-muted transition-all duration-200',
                    open && 'bg-muted/50'
                  )}
                  disabled={disabled}
                >
                  <Star className="!size-5" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('chat.favorites.use')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <PopoverContent
          align="start"
          sideOffset={12}
          className="p-2 w-[300px] rounded-lg border shadow-md bg-background"
        >
          <Command>
            <CommandListScrollable className="max-h-[300px] custom-scrollbar">
              <CommandGroup heading={t('chat.favorites.headline')}>
                {favorites.map((step) => (
                  <CommandItem
                    key={step.id}
                    onSelect={() => {
                      onSelect(step.output);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col gap-1 w-full overflow-hidden">
                      <span className="truncate text-sm">{step.output}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(step.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandListScrollable>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default FavoriteButton;
