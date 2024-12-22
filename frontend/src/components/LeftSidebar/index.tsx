import {
  Sidebar,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import SidebarTrigger from "@/components/header/SidebarTrigger"
import NewChatButton from "../header/NewChat"
import SearchChats from "./Search"
import { ThreadHistory } from "./ThreadHistory"

export default function LeftSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader className="py-3">
        <div className="flex items-center justify-between">
        <SidebarTrigger />
        <div className="flex items-center">
          <SearchChats />
        <NewChatButton />
        </div>
        </div>
      </SidebarHeader>
        <ThreadHistory />
      <SidebarRail />
    </Sidebar>
  )
}
