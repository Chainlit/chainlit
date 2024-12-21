import { useConfig } from '@chainlit/react-client';
import { PanelLeft } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Translator } from 'components/i18n';
import { useSidebar } from '../ui/sidebar';


export default function SidebarTrigger() {
    const { config } = useConfig();
    const {setOpen, open} = useSidebar()

// if(!config?.dataPersistence) return null

return   <TooltipProvider>
<Tooltip>
  <TooltipTrigger asChild>
    
  <Button onClick={() => setOpen(!open)} size="icon" variant="ghost"               className='text-muted-foreground hover:text-muted-foreground'>

      <PanelLeft className="!size-5" />
      </Button>
  </TooltipTrigger>
  <TooltipContent>
    <p>
        {open ? <Translator path="components.organisms.threadHistory.sidebar.TriggerButton.closeSidebar"/> : <Translator path="components.organisms.threadHistory.sidebar.TriggerButton.openSidebar"/>}
    </p>
  </TooltipContent>
</Tooltip>
</TooltipProvider>


}