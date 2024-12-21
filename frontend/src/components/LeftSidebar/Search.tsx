import { useConfig } from '@chainlit/react-client';
import { PanelLeft, Search } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Translator } from 'components/i18n';
import { useSidebar } from '../ui/sidebar';
import { Kbd } from '../Kbd';
import { useEffect, useState } from 'react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
  } from "@/components/ui/command"

export default function SearchChats() {
    const [open, setOpen] = useState(false)
 
    useEffect(() => {
      const down = (e: KeyboardEvent) => {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          setOpen((open) => !open)
        }
      }
   
      document.addEventListener("keydown", down)
      return () => document.removeEventListener("keydown", down)
    }, [])

// if(!config?.dataPersistence) return null

return  <>
<TooltipProvider>
<Tooltip>
  <TooltipTrigger asChild>
    
  <Button onClick={() => setOpen(!open)} size="icon" variant="ghost"               className='text-muted-foreground hover:text-muted-foreground'>

      <Search className="!size-5" />
      </Button>
  </TooltipTrigger>
  <TooltipContent>
    <div className='flex flex-col items-center'>
    <Translator path="components.organisms.threadHistory.sidebar.filters.SearchBar.search"/>
    <Kbd>Cmd+k</Kbd>
    </div>
  </TooltipContent>
</Tooltip>
</TooltipProvider>
<CommandDialog open={open} onOpenChange={setOpen}>
<CommandInput placeholder="Type a command or search..." />
<CommandList>
  <CommandEmpty>No results found.</CommandEmpty>
  <CommandGroup heading="Suggestions">

  </CommandGroup>
  <CommandSeparator />
  <CommandGroup heading="Settings">

  </CommandGroup>
</CommandList>
</CommandDialog>

</>  


}