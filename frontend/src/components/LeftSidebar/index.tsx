
import { useNavigate } from 'react-router-dom';
import { Sidebar, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import NewChatButton from '@/components/header/NewChat';
import SearchChats from './Search';
import { ThreadHistory } from './ThreadHistory';
import SidebarTrigger from '@/components/header/SidebarTrigger';

export default function LeftSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const router = useNavigate();
  
  return (
    <Sidebar {...props} className="border-none">
      <SidebarHeader className="py-3">
        <div className="flex items-center justify-between">
          {/* âœ… Trigger Ã  gauche dans la sidebar quand elle est ouverte */}
          <SidebarTrigger />
          <div className="flex items-center">
            <SearchChats />
            <NewChatButton navigate={router.push} />
          </div>
        </div>
      </SidebarHeader>
      <ThreadHistory />
      <SidebarRail />
    </Sidebar>
  );
}