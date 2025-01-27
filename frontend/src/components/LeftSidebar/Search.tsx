import _ from 'lodash';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { ChainlitContext, IThread } from '@chainlit/react-client';

import { Loader } from '@/components/Loader';
import { Search } from '@/components/icons/Search';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Translator } from 'components/i18n';

import { Kbd } from '../Kbd';

export default function SearchChats() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [threads, setThreads] = useState<IThread[]>([]);
  const [loading, setLoading] = useState(false);

  const apiClient = useContext(ChainlitContext);

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      _.debounce(async (query: string) => {
        setLoading(true);
        try {
          const { data } = await apiClient.listThreads(
            { first: 20, cursor: undefined },
            { search: query || undefined }
          );
          setThreads(data || []);
        } catch (error) {
          toast.error('Error fetching threads: ' + error);
        } finally {
          setLoading(false);
        }
      }, 300),
    [apiClient]
  );

  // Group threads by month and year
  const groupedThreads = useMemo(() => {
    return _.groupBy(threads, (thread) => {
      const date = new Date(thread.createdAt);
      return `${date.toLocaleString('default', {
        month: 'long'
      })} ${date.getFullYear()}`;
    });
  }, [threads]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setOpen(!open)}
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-muted-foreground"
            >
              <Search className="!size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col items-center">
              <Translator path="threadHistory.sidebar.filters.search" />
              <Kbd>Cmd+k</Kbd>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search conversations..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList className="h-[300px] overflow-y-auto">
          {loading ? (
            <CommandEmpty className="p-4 flex items-center justify-center">
              <Loader />
            </CommandEmpty>
          ) : Object.keys(groupedThreads).length === 0 ? (
            <CommandEmpty>No conversations found.</CommandEmpty>
          ) : (
            Object.entries(groupedThreads).map(([monthYear, monthThreads]) => (
              <CommandGroup
                key={`${searchQuery}-${monthYear}`}
                heading={monthYear}
              >
                {monthThreads.map((thread) => (
                  <CommandItem
                    className="cursor-pointer"
                    key={`${searchQuery}-${thread.id}`}
                    value={`${searchQuery}-${thread.id}`}
                    onSelect={() => {
                      setOpen(false);
                      navigate(`/thread/${thread.id}`);
                    }}
                  >
                    {thread.name || 'Untitled Conversation'}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
