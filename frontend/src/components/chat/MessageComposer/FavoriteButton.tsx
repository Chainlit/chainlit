import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@radix-ui/react-popover';
import { Star, Trash } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';

import {
  favoriteMessagesState,
  useChatInteract,
  useConfig
} from '@chainlit/react-client';

import { useTranslation } from '@/components/i18n/Translator';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
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

const TOOLTIP_DELAY_MS = 700;

interface Props {
  disabled?: boolean;
  onSelect: (content: string) => void;
}

export const FavoriteButton = ({ disabled = false, onSelect }: Props) => {
  const favorites = useRecoilValue(favoriteMessagesState);
  const { toggleMessageFavorite } = useChatInteract();
  const { config } = useConfig();
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const hoverTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (open) {
      cancelTooltipOpen();
    }
  }, [open]);

  const scheduleTooltipOpen = () => {
    if (disabled || open) return;
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    hoverTimerRef.current = window.setTimeout(() => {
      setTooltipOpen(true);
    }, TOOLTIP_DELAY_MS);
  };

  const cancelTooltipOpen = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setTooltipOpen(false);
  };

  if (!config?.features?.favorites) return null;

  return (
    <div className={cn('favorite-popover-wrapper')}>
      <Popover
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (val) cancelTooltipOpen();
        }}
      >
        <TooltipProvider>
          <Tooltip open={!open && tooltipOpen}>
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
                  onMouseEnter={scheduleTooltipOpen}
                  onMouseLeave={cancelTooltipOpen}
                  onFocus={cancelTooltipOpen}
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
              {favorites.length === 0 ? (
                <CommandEmpty className="py-6 px-4">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <p className="text-sm font-medium text-foreground">
                      {t('chat.favorites.empty.title')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('chat.favorites.empty.description')}
                    </p>
                  </div>
                </CommandEmpty>
              ) : (
                <CommandGroup heading={t('chat.favorites.headline')}>
                  {favorites.map((step) => (
                    <CommandItem
                      key={step.id}
                      value={step.id}
                      onSelect={() => {
                        onSelect(step.output);
                        setOpen(false);
                        cancelTooltipOpen();
                      }}
                      className="cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
                        <div className="flex flex-col gap-1 overflow-hidden">
                          <span className="truncate text-sm">
                            {step.output}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(step.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          aria-label={t('chat.favorites.remove')}
                          disabled={disabled}
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleMessageFavorite(step);
                          }}
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandListScrollable>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default FavoriteButton;
