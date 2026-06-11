
import _ from 'lodash';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { DialogTitle } from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Translator } from '@/components/i18n';
import { Kbd } from '../Kbd';

// â”€â”€ NOUVEAU : badge tag â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TagBadge({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs
                     bg-primary text-primary-foreground
                     font-mono mr-1">
      {tag}
    </span>
  );
}

// â”€â”€ NOUVEAU : parser les tags d'un thread â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function parseTags(thread: IThread): string[] {
  const raw = (thread as any).tags;
  if (!raw || typeof raw !== 'string') return [];
  return raw.split(',').map((t: string) => t.trim()).filter(Boolean);
}

// â”€â”€ NOUVEAU : vÃ©rifier si un thread correspond Ã  la recherche â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function threadMatchesQuery(thread: IThread, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();

  // Cherche dans le nom
  if ((thread.name || '').toLowerCase().includes(q)) return true;

  // Cherche dans les tags
  const tags = parseTags(thread);
  if (tags.some(tag => tag.toLowerCase().includes(q))) return true;

  return false;
}

export default function SearchChats() {
  const { t } = useTranslation();
  const router = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [threads, setThreads] = useState<IThread[]>([]);
  const [loading, setLoading] = useState(false);

  const apiClient = useContext(ChainlitContext);

  // â”€â”€ MODIFIÃ‰ : charge TOUS les threads puis filtre cÃ´tÃ© client â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Raison : l'API Chainlit filtre sur thread.name uniquement,
  //          pas sur thread.tags. On filtre nous-mÃªmes.
  const debouncedSearch = useMemo(
    () =>
      _.debounce(async (query: string) => {
        setLoading(true);
        try {
          // Charger tous les threads (sans filtre serveur)
          const { data } = await apiClient.listThreads(
            { first: 100, cursor: undefined },
            {}   // â† pas de filtre search cÃ´tÃ© serveur
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

  // â”€â”€ NOUVEAU : filtrage cÃ´tÃ© client sur name + tags â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filteredThreads = useMemo(() => {
    if (!searchQuery) return threads;
    return threads.filter(t => threadMatchesQuery(t, searchQuery));
  }, [threads, searchQuery]);

  // â”€â”€ Groupement par mois (inchangÃ©) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const groupedThreads = useMemo(() => {
    return _.groupBy(filteredThreads, (thread) => {
      const date = new Date(thread.createdAt);
      return `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    });
  }, [filteredThreads]);

  // Raccourci clavier Ctrl+K (inchangÃ©)
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

  // DÃ©clencher la recherche Ã  l'ouverture ET quand la query change
  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => { debouncedSearch.cancel(); };
  }, [searchQuery, debouncedSearch]);

  // Charger les threads Ã  l'ouverture du dialog
  useEffect(() => {
    if (open) debouncedSearch(searchQuery);
  }, [open]);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="search-chats-button"
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
        <DialogTitle className="sr-only">
          {t('threadHistory.sidebar.filters.search')}
        </DialogTitle>
        <CommandInput
          placeholder="Rechercher une conversation..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList className="h-[400px] overflow-y-auto">
          {loading ? (
            <CommandEmpty className="p-4 flex items-center justify-center">
              <Loader />
            </CommandEmpty>
          ) : Object.keys(groupedThreads).length === 0 ? (
            <CommandEmpty>
              {searchQuery
                ? `Aucune conversation pour "${searchQuery}"`
                : <Translator path="threadHistory.sidebar.empty" />
              }
            </CommandEmpty>
          ) : (
            Object.entries(groupedThreads).map(([monthYear, monthThreads]) => (
              <CommandGroup
                key={`${searchQuery}-${monthYear}`}
                heading={monthYear}
              >
                {monthThreads.map((thread) => {
                  const tags = parseTags(thread);
                  // Tags correspondant Ã  la recherche mis en Ã©vidence
                  const matchingTags = searchQuery
                    ? tags.filter(t =>
                        t.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                    : tags.slice(0, 3); // Afficher max 3 tags si pas de recherche

                  return (
                    <CommandItem
                      className="cursor-pointer flex flex-col items-start gap-1 py-2"
                      key={`${searchQuery}-${thread.id}`}
                      value={`${searchQuery}-${thread.id}`}
                      onSelect={() => {
                        setOpen(false);
                        navigate(`/thread/${thread.id}`);
                      }}
                    >
                      {/* Titre de la conversation */}
                      <div className="line-clamp-1 font-medium">
                        {thread.name || 'Untitled Conversation'}
                      </div>

                      {/* Tags affichÃ©s sous le titre */}
                      {matchingTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {matchingTags.map(tag => (
                            <TagBadge key={tag} tag={tag} />
                          ))}
                        </div>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))
          )}
        </CommandList>

        {/* â”€â”€ NOUVEAU : hint sur la recherche par tags â”€â”€ 
        {!searchQuery && (
          <div className="px-3 py-2 text-xs text-muted-foreground border-t">
            ðŸ’¡ Cherchez par Ã©quipement OCP : <code className="bg-muted px-1 rounded">107DAM03</code>,
            {' '}<code className="bg-muted px-1 rounded">SÃ©cheur</code>,
            {' '}<code className="bg-muted px-1 rounded">AM01</code>
          </div>
        )}
          */}
      </CommandDialog>
    </>
  );
}